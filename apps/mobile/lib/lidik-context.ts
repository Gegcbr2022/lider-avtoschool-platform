import type { UserStats } from "./firestore";
import type { PdrCoachPlan } from "./pdr-progress";

export type LidikScreen = "home" | "learning" | "club" | "profile";

export type LidikTipContext = {
  isGuest?: boolean;
  role?: string | null;
  name?: string | null;
  stats?: UserStats | null;
  coachPlan?: PdrCoachPlan | null;
  daysToExam?: number | null;
  leaderboard?: {
    rank?: number | null;
    totalEntries?: number;
    totalAnswered?: number;
    accuracyPct?: number;
    isNovice?: boolean;
    topTenCorrectAnswers?: number | null;
    userCorrectAnswers?: number | null;
  } | null;
  profile?: {
    emailVerified?: boolean;
    hasEmail?: boolean;
  } | null;
};

function firstName(name?: string | null): string {
  return (name ?? "").trim().split(" ")[0] || "";
}

function hasStarted(stats?: UserStats | null, coachPlan?: PdrCoachPlan | null): boolean {
  return Boolean((stats?.testsCompleted ?? 0) > 0 || (coachPlan?.seen ?? 0) > 0);
}

export function getContextualLidikTip(screen: LidikScreen, context: LidikTipContext = {}): string {
  const stats = context.stats ?? null;
  const coachPlan = context.coachPlan ?? null;

  switch (screen) {
    case "home": {
      if (context.isGuest) {
        return "Я Лідик. Можеш пройти демо-тест без реєстрації, а після входу я збережу прогрес і підкажу наступний крок.";
      }
      if (context.role === "instructor") {
        return "Бачу розклад і чати учнів. Почни з найближчих занять або відкрий список учнів, якщо треба швидко відповісти.";
      }
      const name = firstName(context.name);
      if (!hasStarted(stats, coachPlan)) {
        return `${name ? `${name}, ` : ""}пройди перший короткий тест, і я складу маршрут за твоїми реальними відповідями.`;
      }
      if ((context.daysToExam ?? null) !== null && (context.daysToExam ?? 0) <= 3) {
        return `До іспиту ${context.daysToExam} дн. Сьогодні краще пройти повний екзамен і повторити помилки.`;
      }
      if ((stats?.bestScorePct ?? 0) >= 75) {
        return `Твій найкращий результат ${stats?.bestScorePct}%. Тримай форму повним екзаменом і не пропускай практику.`;
      }
      if ((stats?.testsCompleted ?? 0) >= 10) {
        return `Є ${stats?.testsCompleted} тестів. Наступний приріст дасть робота зі слабкими темами, а не випадковий марафон.`;
      }
      return `Прогрес уже є: ${stats?.testsCompleted ?? 0} тестів. Зроби ще одну коротку сесію, щоб я точніше бачив слабкі місця.`;
    }
    case "learning": {
      if (coachPlan?.summary) return coachPlan.summary;
      if (!hasStarted(stats, coachPlan)) {
        return "Ще немає історії відповідей. Почни з короткого тесту, і я покажу теми, які варто підтягнути.";
      }
      if (coachPlan?.recommendedCategory) {
        return `Найкорисніше зараз підтягнути тему «${coachPlan.recommendedCategory}». Там буде найбільший приріст.`;
      }
      if ((stats?.bestScorePct ?? 0) >= 75) {
        return "Теорія виглядає міцно. Закріпи результат пробним іспитом і переходь до практичних занять.";
      }
      return "Продовжуй короткими сесіями. Я оновлю план, коли з'явиться більше відповідей і помилок.";
    }
    case "club": {
      const leaderboard = context.leaderboard ?? null;
      if (!leaderboard || (leaderboard.totalEntries ?? 0) === 0) {
        return "Пройди перший ПДР-тест, і я покажу твоє місце серед учнів автошколи.";
      }
      if ((leaderboard.totalEntries ?? 0) === 1) {
        return "У рейтингу поки мало учасників. Твій наступний тест уже створить чесний темп для змагання.";
      }
      if (leaderboard.isNovice) {
        const left = Math.max(0, 12 - (leaderboard.totalAnswered ?? 0));
        return `Ще ${left} відповідей, і твоя точність піде у чесний залік. Без випадкових чемпіонів.`;
      }
      if ((leaderboard.rank ?? 99) <= 10) {
        return "Ти вже в топ-10. Один короткий тест сьогодні допоможе втримати позицію.";
      }
      if (leaderboard.topTenCorrectAnswers !== null && leaderboard.topTenCorrectAnswers !== undefined && leaderboard.userCorrectAnswers !== null && leaderboard.userCorrectAnswers !== undefined) {
        const delta = Math.max(1, leaderboard.topTenCorrectAnswers - leaderboard.userCorrectAnswers + 1);
        return `До топ-10 лишилось ${delta} правильних відповідей. Поїхали!`;
      }
      return "Роби рівний темп: серія маленьких тестів сильніша за один марафон.";
    }
    case "profile": {
      if (context.isGuest) {
        return "У гостьовому режимі можна дивитися застосунок, але прогрес і документи збережуться тільки після входу.";
      }
      if (context.role === "instructor") {
        return "Профіль інструктора готовий: перевір особисті дані, сповіщення і швидкий перехід до учнів.";
      }
      if (context.profile?.hasEmail && !context.profile.emailVerified) {
        return "Підтверди email, щоб безпечно відновлювати доступ і не втратити навчальний прогрес.";
      }
      if (!hasStarted(stats, coachPlan)) {
        return "Тут буде твоя навчальна статистика. Почни перший тест, і я покажу рекорд, серію та темп.";
      }
      if ((stats?.streakDays ?? 0) > 0) {
        return `Серія ${stats?.streakDays} дн. поспіль. Сьогодні достатньо короткого тесту, щоб не втратити темп.`;
      }
      return `У профілі вже видно ${stats?.testsCompleted ?? 0} тестів. Наступний крок — закріпити найслабшу тему в Навчанні.`;
    }
    default:
      return "Я поруч і підкажу наступний крок, коли з'являться реальні дані прогресу.";
  }
}