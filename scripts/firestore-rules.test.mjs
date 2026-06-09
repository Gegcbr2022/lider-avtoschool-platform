import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { setLogLevel } from "firebase/firestore";

const PROJECT_ID = process.env.GCLOUD_PROJECT ?? "lider-avtoschool";
const rules = readFileSync("infrastructure/firebase/firestore.rules", "utf8");

setLogLevel("silent");

const testEnv = await initializeTestEnvironment({
  projectId: PROJECT_ID,
  firestore: { rules },
});

async function seedFirestore() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await db.doc("payments/pay-user-a").set({
      studentId: "user-a",
      amount: 12000,
      currency: "UAH",
      status: "pending",
    });
    await db.doc("payments/pay-user-b").set({
      studentId: "user-b",
      amount: 8000,
      currency: "UAH",
      status: "pending",
    });
    await db.doc("userBonuses/user-a").set({
      balance: 1,
      totalEarned: 1,
      history: [{ type: "earn", amount: 1, reason: "seed", createdAt: "2026-06-08T00:00:00.000Z" }],
      updatedAt: "2026-06-08T00:00:00.000Z",
    });
    await db.doc("instructors/instructor-1").set({
      name: "Instructor One",
      accountUserId: "instructor-a",
      active: true,
    });
    await db.doc("bookingSlots/slot-open").set({
      instructorId: "instructor-1",
      instructorUserId: "instructor-a",
      startsAt: "2026-06-18T09:00:00.000Z",
      status: "open",
    });
    await db.doc("bookingSlots/slot-open-2").set({
      instructorId: "instructor-1",
      instructorUserId: "instructor-a",
      startsAt: "2026-06-18T12:00:00.000Z",
      status: "open",
    });
    await db.doc("bookings/booking-pending").set({
      studentId: "user-a",
      studentName: "Student A",
      instructorId: "instructor-1",
      instructorName: "Instructor One",
      instructorUserId: "instructor-a",
      slotId: "seed-slot-pending",
      startsAt: "2026-06-19T09:00:00.000Z",
      status: "pending",
      createdAt: "2026-06-08T00:00:00.000Z",
      updatedAt: "2026-06-08T00:00:00.000Z",
    });
    await db.doc("bookings/booking-confirmed").set({
      studentId: "user-a",
      studentName: "Student A",
      instructorId: "instructor-1",
      instructorName: "Instructor One",
      instructorUserId: "instructor-a",
      slotId: "seed-slot-confirmed",
      startsAt: "2026-06-20T09:00:00.000Z",
      status: "confirmed",
      createdAt: "2026-06-08T00:00:00.000Z",
      updatedAt: "2026-06-08T00:00:00.000Z",
      confirmedAt: "2026-06-08T01:00:00.000Z",
    });
  });
}

async function run() {
  await testEnv.clearFirestore();
  await seedFirestore();

  const owner = testEnv.authenticatedContext("user-a").firestore();
  const newOwner = testEnv.authenticatedContext("user-c").firestore();
  const other = testEnv.authenticatedContext("user-b").firestore();
  const admin = testEnv.authenticatedContext("admin-a", { role: "admin" }).firestore();
  const manager = testEnv.authenticatedContext("manager-a", { role: "manager" }).firestore();
  const instructor = testEnv.authenticatedContext("instructor-a").firestore();
  const anon = testEnv.unauthenticatedContext().firestore();

  // userProfiles.pushToken: the app may write only the current user's device token.
  await assertSucceeds(owner.doc("userProfiles/user-a").set({
    name: "Student A",
    pushToken: "fcm-token-user-a",
    updatedAt: "2026-06-09T00:00:00.000Z",
  }));
  await assertFails(other.doc("userProfiles/user-a").update({ pushToken: "stolen-token" }));
  await assertFails(anon.doc("userProfiles/user-a").set({ pushToken: "anon-token" }));
  await assertSucceeds(manager.doc("userProfiles/user-a").update({ pushToken: "staff-corrected-token" }));

  // payments: user can read only own payment docs; staff can write; clients cannot write.
  await assertSucceeds(owner.doc("payments/pay-user-a").get());
  await assertFails(owner.doc("payments/pay-user-b").get());
  await assertFails(anon.doc("payments/pay-user-a").get());
  await assertFails(owner.doc("payments/pay-user-a").set({ studentId: "user-a", amount: 1 }));
  await assertSucceeds(admin.doc("payments/pay-user-a").update({ status: "paid" }));
  await assertSucceeds(manager.doc("payments/pay-user-b").update({ status: "review" }));

  // userBonuses: owner reads own doc; other users and anonymous clients cannot read it.
  await assertSucceeds(owner.doc("userBonuses/user-a").get());
  await assertFails(other.doc("userBonuses/user-a").get());
  await assertFails(anon.doc("userBonuses/user-a").get());

  // Owner can create/increment only small own bonuses used by the app (+1/+2).
  await assertSucceeds(newOwner.doc("userBonuses/user-c").set({
    balance: 1,
    totalEarned: 1,
    history: [{ type: "earn", amount: 1, reason: "Тест 80%", createdAt: "2026-06-08T00:00:00.000Z" }],
    updatedAt: "2026-06-08T00:00:00.000Z",
  }));
  await assertSucceeds(owner.doc("userBonuses/user-a").update({
    balance: 3,
    totalEarned: 3,
    history: [
      { type: "earn", amount: 1, reason: "seed", createdAt: "2026-06-08T00:00:00.000Z" },
      { type: "earn", amount: 2, reason: "Іспит 92%", createdAt: "2026-06-08T01:00:00.000Z" },
    ],
    updatedAt: "2026-06-08T01:00:00.000Z",
  }));

  // Owner cannot write another user's bonus doc, mint a huge balance, or spend from the client.
  await assertFails(owner.doc("userBonuses/user-b").set({
    balance: 1,
    totalEarned: 1,
    history: [],
    updatedAt: "2026-06-08T00:00:00.000Z",
  }));
  await assertFails(owner.doc("userBonuses/user-a").set({
    balance: 999,
    totalEarned: 999,
    history: [{ type: "earn", amount: 999, reason: "too much", createdAt: "2026-06-08T02:00:00.000Z" }],
    updatedAt: "2026-06-08T02:00:00.000Z",
  }));
  await assertFails(owner.doc("userBonuses/user-a").set({
    balance: 0,
    totalEarned: 3,
    history: [{ type: "spend", amount: 3, reason: "client spend", createdAt: "2026-06-08T03:00:00.000Z" }],
    updatedAt: "2026-06-08T03:00:00.000Z",
  }));

  // Staff can correct bonuses if an operational adjustment is needed.
  await assertSucceeds(admin.doc("userBonuses/user-b").set({
    balance: 50,
    totalEarned: 50,
    history: [{ type: "earn", amount: 50, reason: "staff adjustment", createdAt: "2026-06-08T00:00:00.000Z" }],
    updatedAt: "2026-06-08T00:00:00.000Z",
  }));

  // bookings: students book only real slots; instructors own the forward status flow.
  await assertSucceeds(owner.doc("bookingSlots/slot-open").get());
  await assertFails(anon.doc("bookingSlots/slot-open").get());
  const bookingBatch = owner.batch();
  bookingBatch.set(owner.doc("bookings/booking-from-slot"), {
    studentId: "user-a",
    studentName: "Student A",
    instructorId: "instructor-1",
    instructorName: "Instructor One",
    instructorUserId: "instructor-a",
    slotId: "slot-open",
    startsAt: "2026-06-18T09:00:00.000Z",
    status: "pending",
    createdAt: "2026-06-08T04:00:00.000Z",
    updatedAt: "2026-06-08T04:00:00.000Z",
  });
  bookingBatch.update(owner.doc("bookingSlots/slot-open"), {
    status: "booked",
    bookedBy: "user-a",
    bookingId: "booking-from-slot",
    updatedAt: "2026-06-08T04:00:00.000Z",
  });
  await assertSucceeds(bookingBatch.commit());
  await assertFails(owner.doc("bookings/booking-without-slot").set({
    studentId: "user-a",
    studentName: "Student A",
    instructorId: "instructor-1",
    instructorName: "Instructor One",
    startsAt: "2026-06-18T10:00:00.000Z",
    status: "pending",
    createdAt: "2026-06-08T04:00:00.000Z",
  }));
  await assertFails(owner.doc("bookingSlots/slot-open-2").update({
    status: "booked",
    bookedBy: "user-a",
    bookingId: "missing-booking",
    updatedAt: "2026-06-08T04:05:00.000Z",
  }));
  await assertFails(owner.doc("bookings/booking-pending").update({
    status: "confirmed",
    updatedAt: "2026-06-08T05:00:00.000Z",
    confirmedAt: "2026-06-08T05:00:00.000Z",
  }));
  await assertSucceeds(instructor.doc("bookings/booking-pending").update({
    status: "confirmed",
    updatedAt: "2026-06-08T05:00:00.000Z",
    confirmedAt: "2026-06-08T05:00:00.000Z",
  }));
  await assertSucceeds(instructor.doc("bookings/booking-confirmed").update({
    status: "completed",
    updatedAt: "2026-06-08T06:00:00.000Z",
    completedAt: "2026-06-08T06:00:00.000Z",
  }));
  await assertFails(other.doc("bookings/booking-confirmed").update({
    status: "cancelled",
    updatedAt: "2026-06-08T07:00:00.000Z",
    cancelledAt: "2026-06-08T07:00:00.000Z",
  }));

  assert.equal((await owner.doc("payments/pay-user-a").get()).data()?.status, "paid");
}

try {
  await run();
  console.log("Firestore rules tests passed: userProfiles.pushToken/payments/userBonuses/bookings");
} finally {
  await testEnv.cleanup();
}
