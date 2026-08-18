import type { Locale } from "./types";
import {
  DEFAULT_ANALYTICS_COPY,
  type AnalyticsCopy,
} from "@/components/tracking/analyticsCopy";
import {
  DEFAULT_CALIBRATION_COPY,
  type CalibrationCopy,
} from "@/components/camera/calibrationCopy";

type Copy = {
  appTitle: string;
  appSubtitle: string;
  start: string;
  login: string;
  signup: string;
  username: string;
  password: string;
  field1: string;
  field2: string;
  field3: string;
  signupSuccess: string;
  stagePrepare: string;
  stageStep: string;
  stage1Step1Title: string;
  stage1Step2Title: string;
  stage1Step3Title: string;
  stage2Step1Title: string;
  stage2Step2Title: string;
  stage3Step1Title: string;
  stage3Step2Title: string;
  stage3Step3Title: string;
  continue: string;
  next: string;
  congratsTitle: string;
  completion: string;
  accuracy: string;
  timeLagged: string;
  timeLag: string;
  leftTurn: string;
  rightTurn: string;
  averageAngle: string;
  disclaimer: string;
  terms: string;
  submit: string;
  stageComplete: string;
  stageCompleteMessage: string;
  returnHome: string;
  logout: string;
  restart: string;
  continueToStage2: string;
  continueToStage3: string;
  selectLanguage: string;
  english: string;
  traditionalChinese: string;
  simplifiedChinese: string;
  prepareInstruction: string;
  demoInstruction: string;
  trainingInstruction: string;
  startTraining: string;
  beginTrainingToday: string;
  welcomeBack: string;
  beganTrainingDaysAgo: string;
  beganTrainingToday: string;
  todayLabel: string;
  doctorsNotes: string;
  searchForRecord: string;
  yearFilter: string;
  monthFilter: string;
  dateFilter: string;
  details: string;
  noMoreRecords: string;
  cameraPermissionTitle: string;
  cameraPermissionMessage: string;
  allowCamera: string;
  denyCamera: string;
  cameraDenied: string;
  cameraUnavailable: string;
  cameraLoading: string;
  calibrationRequired: string;
  calibrationComplete: string;
  viewTrackingAnalytics: string;
  closeAnalytics: string;
  trackAInstruction: string;
  lookAtLetterAInstruction: string;
  shoulderRotationInstruction: string;
  vergenceInstruction: string;
  countdownReady: string;
  countdownGo: string;
  placeholder: string;
};

const copy: Record<Locale, Copy> = {
  en: {
    appTitle: "Interactive Vestibular Rehabilitation Therapy",
    appSubtitle: "治療眩暈（頭暈）練習操",
    start: "Start",
    login: "Log In",
    signup: "Sign Up",
    username: "User Name",
    password: "Password",
    field1: "e-mail / Phone number",
    field2: "Age",
    field3: "Disease diagnosed",
    signupSuccess: "Signed up successfully! You're all set.",
    stagePrepare: "Stage {n}: Prepare",
    stageStep: "Stage {n}: Step {m}",
    stage1Step1Title: "Stage 1: Step 1- Smooth Pursuit (vertical)",
    stage1Step2Title: "Stage 1 Step 2 - Smooth Pursuit (horizontal)",
    stage1Step3Title: "Stage 1: Step 3 - Visual Tracking Exercise",
    stage2Step1Title: "Stage 2: Step 1 - Nodding",
    stage2Step2Title: "Stage 2: Step 2 - Turning",
    stage3Step1Title: "Stage 3: Step 1 - Shoulder Shrugs",
    stage3Step2Title: "Stage 3: Step 2 - Shoulder Rotations",
    stage3Step3Title: "Stage 3: Step 3 - Waist Twists",
    continue: "Continue",
    next: "Next",
    congratsTitle: "Way to go!",
    completion: "Completion",
    accuracy: "Accuracy",
    timeLagged: "Time lagged",
    timeLag: "Time Lag",
    leftTurn: "Left Turn",
    rightTurn: "Right Turn",
    averageAngle: "Average angle",
    disclaimer:
      "This is a self-practice tool based on CUHK guidelines. It is NOT a substitute for medical advice. Stop immediately if symptoms worsen.",
    terms: "I agree & understand the terms & conditions",
    submit: "Sign Up",
    stageComplete: "Stage Complete!",
    stageCompleteMessage:
      "Congratulations! You have completed all training steps.",
    returnHome: "Return Home",
    logout: "Log Out",
    restart: "Restart Stage",
    continueToStage2: "Continue to Stage 2",
    continueToStage3: "Continue to Stage 3",
    selectLanguage: "Select Language",
    english: "English",
    traditionalChinese: "繁體中文",
    simplifiedChinese: "简体中文",
    prepareInstruction:
      "Follow the instructions below to prepare for your vestibular exercise.",
    demoInstruction:
      "Watch the demonstration video before starting the exercise.",
    trainingInstruction:
      "Perform the head movement as shown. Stay within the target angles.",
    startTraining: "Start Training",
    beginTrainingToday: "Begin Training Today!",
    welcomeBack: "Welcome back {name}!",
    beganTrainingDaysAgo: "Began training {n} days ago!",
    beganTrainingToday: "Began training today!",
    todayLabel: "Today!",
    doctorsNotes: "Doctor's Notes:",
    searchForRecord: "Search for record",
    yearFilter: "Year",
    monthFilter: "Month",
    dateFilter: "Date",
    details: "Details",
    noMoreRecords: "No more records",
    cameraPermissionTitle: "Camera Access",
    cameraPermissionMessage:
      "Vertigo Training needs access to your camera to guide your head positioning during exercises.",
    allowCamera: "Allow Camera",
    denyCamera: "Not Now",
    cameraDenied:
      "Camera access was denied. Please enable camera permissions in your browser settings.",
    cameraUnavailable: "Camera is not available on this device.",
    cameraLoading: "Loading camera…",
    calibrationRequired:
      "Complete the eye calibration above before continuing to Step 1.",
    calibrationComplete: "Calibrated",
    viewTrackingAnalytics: "View Tracking Analytics",
    closeAnalytics: "Close",
    trackAInstruction: "Track the 'A' with your eyes.",
    lookAtLetterAInstruction: "Look at the letter A",
    shoulderRotationInstruction:
      "Look at the letter A, rotate shoulder when hearing the beep sound",
    vergenceInstruction:
      "Look at your finger, move finger following the rhythm",
    countdownReady: "Ready?",
    countdownGo: "GO!",
    placeholder: "Insert text here",
  },
  "zh-Hant": {
    appTitle: "Interactive Vestibular Rehabilitation Therapy",
    appSubtitle: "治療眩暈（頭暈）練習操",
    start: "開始",
    login: "登入",
    signup: "註冊",
    username: "用戶名",
    password: "密碼",
    field1: "電郵 / 電話號碼",
    field2: "年齡",
    field3: "確診疾病",
    signupSuccess: "註冊成功～ 一切準備就緒",
    stagePrepare: "第一級：準備",
    stageStep: "第一級：第{m}部分",
    stage1Step1Title: "第一級：第1部分 - 垂直平滑追視",
    stage1Step2Title: "第一級：第2部分 - 水平平滑追視",
    stage1Step3Title: "第一級：第3部分 - 視覺追蹤練習",
    stage2Step1Title: "第二級：第1部分 - 點頭",
    stage2Step2Title: "第二級：第2部分 - 轉頭",
    stage3Step1Title: "第三級：第1部分 - 聳肩",
    stage3Step2Title: "第三級：第2部分 - 肩膊轉圈",
    stage3Step3Title: "第三級：第3部分 - 腰部左右轉",
    continue: "繼續",
    next: "下一步",
    congratsTitle: "做得好！",
    completion: "完成度",
    accuracy: "準確度",
    timeLagged: "反應延遲",
    timeLag: "反應延遲",
    leftTurn: "向左轉",
    rightTurn: "向右轉",
    averageAngle: "平均角度",
    disclaimer:
      "此乃根據中大指引而設的自我練習工具，並非醫療建議的替代品。如症狀惡化，請立即停止。",
    terms: "我同意並了解條款及細則",
    submit: "註冊",
    stageComplete: "階段完成！",
    stageCompleteMessage: "恭喜！你已完成所有訓練步驟。",
    returnHome: "返回主頁",
    logout: "登出",
    restart: "重新開始",
    continueToStage2: "繼續第二級",
    continueToStage3: "繼續第三級",
    selectLanguage: "選擇語言",
    english: "English",
    traditionalChinese: "繁體中文",
    simplifiedChinese: "简体中文",
    prepareInstruction: "請按照以下指示準備進行前庭康復練習。",
    demoInstruction: "開始練習前，請先觀看示範影片。",
    trainingInstruction: "請按照示範進行頭部動作，保持在目標角度範圍內。",
    startTraining: "開始訓練",
    beginTrainingToday: "開始今天的訓練！",
    welcomeBack: "{name}歡迎回來！",
    beganTrainingDaysAgo: "已開始訓練 {n} 天！",
    beganTrainingToday: "今天開始訓練！",
    todayLabel: "今天！",
    doctorsNotes: "醫生備註：",
    searchForRecord: "搜尋紀錄",
    yearFilter: "年",
    monthFilter: "月",
    dateFilter: "日",
    details: "詳情",
    noMoreRecords: "沒有更多紀錄",
    cameraPermissionTitle: "相機權限",
    cameraPermissionMessage: "Vertigo Training 需要存取您的相機，以在練習時引導頭部位置。",
    allowCamera: "允許相機",
    denyCamera: "暫不允許",
    cameraDenied: "相機權限被拒絕。請在瀏覽器設定中啟用相機權限。",
    cameraUnavailable: "此裝置無法使用相機。",
    cameraLoading: "正在載入相機…",
    calibrationRequired: "請先完成上方的眼部校準，然後才能進入第一步。",
    calibrationComplete: "已校準",
    viewTrackingAnalytics: "查看追蹤分析",
    closeAnalytics: "關閉",
    trackAInstruction: "用眼睛追蹤「A」。",
    lookAtLetterAInstruction: "請注視字母 A",
    shoulderRotationInstruction: "請注視字母 A，聽到嗶聲時轉動肩膊",
    vergenceInstruction: "看著手指，跟隨節奏移動手指。",
    countdownReady: "準備好了嗎？",
    countdownGo: "開始！",
    placeholder: "請輸入文字",
  },
  "zh-Hans": {
    appTitle: "Interactive Vestibular Rehabilitation Therapy",
    appSubtitle: "治疗眩晕（头晕）练习操",
    start: "开始",
    login: "登录",
    signup: "注册",
    username: "用户名",
    password: "密码",
    field1: "电邮 / 电话号码",
    field2: "年龄",
    field3: "确诊疾病",
    signupSuccess: "注册成功～ 一切准备就绪",
    stagePrepare: "第一级：准备",
    stageStep: "第一级：第{m}部分",
    stage1Step1Title: "第一级：第1部分 - 垂直平滑追视",
    stage1Step2Title: "第一级：第2部分 - 水平平滑追视",
    stage1Step3Title: "第一级：第3部分 - 视觉追踪练习",
    stage2Step1Title: "第二级：第1部分 - 点头",
    stage2Step2Title: "第二级：第2部分 - 转头",
    stage3Step1Title: "第三级：第1部分 - 耸肩",
    stage3Step2Title: "第三级：第2部分 - 肩膀绕圈",
    stage3Step3Title: "第三级：第3部分 - 腰部左右转",
    continue: "继续",
    next: "下一步",
    congratsTitle: "做得好！",
    completion: "完成度",
    accuracy: "准确度",
    timeLagged: "反应延迟",
    timeLag: "反应延迟",
    leftTurn: "向左转",
    rightTurn: "向右转",
    averageAngle: "平均角度",
    disclaimer:
      "此乃根据中大指引而设的自我练习工具，并非医疗建议的替代品。如症状恶化，请立即停止。",
    terms: "我同意并了解条款及细则",
    submit: "注册",
    stageComplete: "阶段完成！",
    stageCompleteMessage: "恭喜！你已完成所有训练步骤。",
    returnHome: "返回主页",
    logout: "登出",
    restart: "重新开始",
    continueToStage2: "继续第二级",
    continueToStage3: "继续第三级",
    selectLanguage: "选择语言",
    english: "English",
    traditionalChinese: "繁體中文",
    simplifiedChinese: "简体中文",
    prepareInstruction: "请按照以下指示准备进行前庭康复练习。",
    demoInstruction: "开始练习前，请先观看示范视频。",
    trainingInstruction: "请按照示范进行头部动作，保持在目标角度范围内。",
    startTraining: "开始训练",
    beginTrainingToday: "开始今天的训练！",
    welcomeBack: "{name}欢迎回来！",
    beganTrainingDaysAgo: "已开始训练 {n} 天！",
    beganTrainingToday: "今天开始训练！",
    todayLabel: "今天！",
    doctorsNotes: "医生备注：",
    searchForRecord: "搜索记录",
    yearFilter: "年",
    monthFilter: "月",
    dateFilter: "日",
    details: "详情",
    noMoreRecords: "没有更多记录",
    cameraPermissionTitle: "相机权限",
    cameraPermissionMessage: "Vertigo Training 需要访问您的相机，以在练习时引导头部位置。",
    allowCamera: "允许相机",
    denyCamera: "暂不允许",
    cameraDenied: "相机权限被拒绝。请在浏览器设置中启用相机权限。",
    cameraUnavailable: "此设备无法使用相机。",
    cameraLoading: "正在加载相机…",
    calibrationRequired: "请先完成上方的眼部校准，然后才能进入第一步。",
    calibrationComplete: "已校准",
    viewTrackingAnalytics: "查看追踪分析",
    closeAnalytics: "关闭",
    trackAInstruction: "用眼睛追踪「A」。",
    lookAtLetterAInstruction: "请注视字母 A",
    shoulderRotationInstruction: "请注视字母 A，听到哔声时转动肩膀",
    vergenceInstruction: "看着手指，跟随节奏移动手指。",
    countdownReady: "准备好了吗？",
    countdownGo: "开始！",
    placeholder: "请输入文字",
  },
};

export function t(locale: Locale, key: keyof Copy): string {
  return copy[locale][key];
}

export const WEEKDAY_SHORT: Record<Locale, string[]> = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  "zh-Hant": ["日", "一", "二", "三", "四", "五", "六"],
  "zh-Hans": ["日", "一", "二", "三", "四", "五", "六"],
};

export const WEEKDAY_LETTERS: Record<Locale, string[]> = {
  en: ["S", "M", "T", "W", "T", "F", "S"],
  "zh-Hant": ["日", "一", "二", "三", "四", "五", "六"],
  "zh-Hans": ["日", "一", "二", "三", "四", "五", "六"],
};

export const MONTH_NAMES: Record<Locale, string[]> = {
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  "zh-Hant": [
    "一月",
    "二月",
    "三月",
    "四月",
    "五月",
    "六月",
    "七月",
    "八月",
    "九月",
    "十月",
    "十一月",
    "十二月",
  ],
  "zh-Hans": [
    "一月",
    "二月",
    "三月",
    "四月",
    "五月",
    "六月",
    "七月",
    "八月",
    "九月",
    "十月",
    "十一月",
    "十二月",
  ],
};

export function formatWelcomeBack(locale: Locale, name: string): string {
  return copy[locale].welcomeBack.replace("{name}", name);
}

export function formatBeganTraining(locale: Locale, days: number): string {
  if (days <= 0) return copy[locale].beganTrainingToday;
  return copy[locale].beganTrainingDaysAgo.replace("{n}", String(days));
}

/** Short label for records list, e.g. "S1 - Smooth Pursuit (vertical)". */
export function formatRecordStepLabel(
  locale: Locale,
  stage: number,
  step: number,
): string {
  const full = formatStageStep(locale, stage, step);
  const cleaned = full
    .replace(/^Stage\s+\d+\s*:\s*Step\s+\d+\s*-?\s*/i, "")
    .replace(/^Stage\s+\d+\s+Step\s+\d+\s*-\s*/i, "")
    .replace(/^第[一二三1-3]級[：:]\s*第\d+部分\s*-\s*/, "")
    .replace(/^第[一二三1-3]级[：:]\s*第\d+部分\s*-\s*/, "")
    .trim();
  return `S${step} - ${cleaned || full}`;
}

export function formatRecordMetrics(metrics: {
  completionPct: number;
  accuracyPct: number;
  averageAngleDeg: number;
  shoulderCompletionCount?: number;
  shoulderMeanPeakLagSec?: number;
  waistLeftTurnCount?: number;
  waistRightTurnCount?: number;
  waistMeanPeakLagSec?: number;
}): string {
  if (
    metrics.waistLeftTurnCount != null &&
    metrics.waistRightTurnCount != null &&
    metrics.waistMeanPeakLagSec != null
  ) {
    return `${metrics.waistLeftTurnCount}/20 · ${metrics.waistRightTurnCount}/20 · ${metrics.waistMeanPeakLagSec.toFixed(1)}s`;
  }
  if (
    metrics.shoulderCompletionCount != null &&
    metrics.shoulderMeanPeakLagSec != null
  ) {
    return `${metrics.shoulderCompletionCount}/20 · ${metrics.shoulderMeanPeakLagSec.toFixed(1)}s`;
  }
  return `${metrics.completionPct}% · ${metrics.accuracyPct}% · ${metrics.averageAngleDeg}°`;
}

export function formatStagePrepare(locale: Locale, stage: number): string {
  if (locale === "zh-Hant") {
    if (stage === 2) return "第二級：準備";
    if (stage === 3) return "第三級：準備";
    return copy[locale].stagePrepare;
  }

  if (locale === "zh-Hans") {
    if (stage === 2) return "第二级：准备";
    if (stage === 3) return "第三级：准备";
    return copy[locale].stagePrepare;
  }

  return copy[locale].stagePrepare.replace("{n}", String(stage));
}

export function formatStageStep(
  locale: Locale,
  stage: number,
  step: number,
): string {
  if (stage === 1 && step === 1) {
    return copy[locale].stage1Step1Title;
  }

  if (stage === 1 && step === 2) {
    return copy[locale].stage1Step2Title;
  }

  if (stage === 1 && step === 3) {
    return copy[locale].stage1Step3Title;
  }

  if (stage === 2 && step === 1) {
    return copy[locale].stage2Step1Title;
  }

  if (stage === 2 && step === 2) {
    return copy[locale].stage2Step2Title;
  }

  if (stage === 3 && step === 1) {
    return copy[locale].stage3Step1Title;
  }

  if (stage === 3 && step === 2) {
    return copy[locale].stage3Step2Title;
  }

  if (stage === 3 && step === 3) {
    return copy[locale].stage3Step3Title;
  }

  const template = copy[locale].stageStep;
  return template.replace("{n}", String(stage)).replace("{m}", String(step));
}

/**
 * Localized copy for the eye-calibration overlay. The English entry reuses the
 * Tracking module default so the standalone build and the host app never drift.
 */
const calibrationCopyByLocale: Record<Locale, CalibrationCopy> = {
  en: DEFAULT_CALIBRATION_COPY,
  "zh-Hant": {
    faceCamera: "請正視鏡頭以開始",
    moveFurther: "請移遠一些",
    moveCloser: "請靠近一些",
    positionConfirmed: "位置已確認",
    calibratingFov: "正在校準視野範圍…",
    lookAtTargetReady: "請注視{target}目標，準備好後按「確認」。",
    lookAtTarget: "請注視{target}目標",
    distanceCheckTitle: "校準前距離檢查",
    fovTitle: "視野校準 — 請凝視高亮的目標",
    estimatedDistance: "估計距離",
    targetDistance: "目標距離",
    targetShort: "目標",
    visualAngle: "{deg}° 視角",
    adjustDistance: "確認下一點前，請先調整距離。",
    captureEachPoint: "在 ±{deg}°（{target}）確認每個點",
    capture: "確認",
    allPointsCaptured: "已擷取所有校準點",
    calibrateFov: "校準視野",
    cancelCalibration: "取消校準",
    targetNames: {
      center: "中央",
      left: "左方",
      right: "右方",
      up: "上方",
      down: "下方",
    },
  },
  "zh-Hans": {
    faceCamera: "请正视镜头以开始",
    moveFurther: "请移远一些",
    moveCloser: "请靠近一些",
    positionConfirmed: "位置已确认",
    calibratingFov: "正在校准视野范围…",
    lookAtTargetReady: "请注视{target}目标，准备好后点击「确认」。",
    lookAtTarget: "请注视{target}目标",
    distanceCheckTitle: "校准前距离检查",
    fovTitle: "视野校准 — 请凝视高亮的目标",
    estimatedDistance: "估计距离",
    targetDistance: "目标距离",
    targetShort: "目标",
    visualAngle: "{deg}° 视角",
    adjustDistance: "确认下一点前，请先调整距离。",
    captureEachPoint: "在 ±{deg}°（{target}）确认每个点",
    capture: "确认",
    allPointsCaptured: "已捕获所有校准点",
    calibrateFov: "校准视野",
    cancelCalibration: "取消校准",
    targetNames: {
      center: "中央",
      left: "左方",
      right: "右方",
      up: "上方",
      down: "下方",
    },
  },
};

/**
 * Localized copy for the tracking analytics dashboard. The English entry reuses
 * the Tracking module default so the standalone build and host app never drift.
 */
const analyticsCopyByLocale: Record<Locale, AnalyticsCopy> = {
  en: DEFAULT_ANALYTICS_COPY,
  "zh-Hant": {
    pipeline: "處理管線",
    recording: "錄製",
    samples: "樣本",
    movement: "移動",
    vergence: "聚散",
    vertical: "垂直",
    calibration: "校準",
    injected: "已載入",
    pending: "待處理",
    leftCorrectedH: "左眼校正（水平）",
    rightCorrectedH: "右眼校正（水平）",
    stability: "穩定度",
    fovGaze: "視野注視",
    notCalibrated: "未校準",
    verticalEyeMovement: "垂直眼動",
    horizontalEyeMovement: "水平眼動",
    switchTo: "切換至{mode}",
    sourceRaw: "原始",
    sourceIsolated: "校正後",
    correctedTitle: "校正後眼動",
    correctedSubtitle: "扣除頭部旋轉後的眼球轉動。",
    rawTitle: "原始眼動",
    rawSubtitle: "相對於目標、未經校正的眼動。",
    leftEyeCorrected: "左眼（已校正）",
    rightEyeCorrected: "右眼（已校正）",
    leftEyeRaw: "左眼（原始）",
    rightEyeRaw: "右眼（原始）",
    targetPath: "目標路徑",
    targetPosition: "目標位置",
    calibrationRequired: "需先完成校準才能繪製追蹤數據。",
    waitingSamples: "正在等待追蹤樣本…",
    vergenceTracking: "聚散追蹤",
    vergenceRequired: "需先完成校準才能繪製聚散數據。",
    waitingVergence: "正在等待聚散追蹤樣本…",
    convergenceAngle: "聚合角度（度）",
    gazeStability: "注視穩定度",
    stabilityIndex: "穩定度指數",
    headTilt: "頭部傾斜（轉動）",
    rollDegrees: "翻滾（度）",
    headPitchMovement: "頭部俯仰（垂直）",
    headYawMovement: "頭部偏航（水平）",
    headPitchDegrees: "俯仰（度）",
    headYawDegrees: "偏航（度）",
    headMovementSubtitle: "相對於環節基線的頭部旋轉。可與上方眼動圖表對比。",
    waitingHeadPose: "正在等待頭部姿態樣本…",
    combinedHeadMovement: "合併頭部運動（俯仰與偏航）",
    headEyeVelocity: "頭部與眼動速度",
    headEyeVelocitySubtitle: "環節期間的角速度。",
    headVelocity: "頭部速度",
    eyeVelocity: "眼動速度",
    scrollToView: "滾動以查看完整記錄",
    shoulderVerticalMovement: "肩膀垂直移動",
    shoulderHorizontalMovement: "肩膀水平移動",
    shoulderMovementSubtitle: "相對於環節基線的左、右肩移動。",
    waitingShoulderMovement: "正在等待肩膀移動樣本…",
    leftShoulder: "左肩",
    rightShoulder: "右肩",
  },
  "zh-Hans": {
    pipeline: "处理管线",
    recording: "录制",
    samples: "样本",
    movement: "移动",
    vergence: "聚散",
    vertical: "垂直",
    calibration: "校准",
    injected: "已载入",
    pending: "待处理",
    leftCorrectedH: "左眼校正（水平）",
    rightCorrectedH: "右眼校正（水平）",
    stability: "稳定度",
    fovGaze: "视野注视",
    notCalibrated: "未校准",
    verticalEyeMovement: "垂直眼动",
    horizontalEyeMovement: "水平眼动",
    switchTo: "切换至{mode}",
    sourceRaw: "原始",
    sourceIsolated: "校正后",
    correctedTitle: "校正后眼动",
    correctedSubtitle: "扣除头部旋转后的眼球转动。",
    rawTitle: "原始眼动",
    rawSubtitle: "相对于目标、未经校正的眼动。",
    leftEyeCorrected: "左眼（已校正）",
    rightEyeCorrected: "右眼（已校正）",
    leftEyeRaw: "左眼（原始）",
    rightEyeRaw: "右眼（原始）",
    targetPath: "目标路径",
    targetPosition: "目标位置",
    calibrationRequired: "需先完成校准才能绘制追踪数据。",
    waitingSamples: "正在等待追踪样本…",
    vergenceTracking: "聚散追踪",
    vergenceRequired: "需先完成校准才能绘制聚散数据。",
    waitingVergence: "正在等待聚散追踪样本…",
    convergenceAngle: "聚合角度（度）",
    gazeStability: "注视稳定度",
    stabilityIndex: "稳定度指数",
    headTilt: "头部倾斜（转动）",
    rollDegrees: "翻滚（度）",
    headPitchMovement: "头部俯仰（垂直）",
    headYawMovement: "头部偏航（水平）",
    headPitchDegrees: "俯仰（度）",
    headYawDegrees: "偏航（度）",
    headMovementSubtitle: "相对于环节基线的头部旋转。可与上方眼动图表对比。",
    waitingHeadPose: "正在等待头部姿态样本…",
    combinedHeadMovement: "合并头部运动（俯仰与偏航）",
    headEyeVelocity: "头部与眼动速度",
    headEyeVelocitySubtitle: "环节期间的角速度。",
    headVelocity: "头部速度",
    eyeVelocity: "眼动速度",
    scrollToView: "滚动以查看完整记录",
    shoulderVerticalMovement: "肩膀垂直移动",
    shoulderHorizontalMovement: "肩膀水平移动",
    shoulderMovementSubtitle: "相对于环节基线的左、右肩移动。",
    waitingShoulderMovement: "正在等待肩膀移动样本…",
    leftShoulder: "左肩",
    rightShoulder: "右肩",
  },
};

export function getCalibrationCopy(locale: Locale): CalibrationCopy {
  return calibrationCopyByLocale[locale];
}

export function getAnalyticsCopy(locale: Locale): AnalyticsCopy {
  return analyticsCopyByLocale[locale];
}
