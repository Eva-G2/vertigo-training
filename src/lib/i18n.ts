import type { Locale } from "./types";

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
  continue: string;
  next: string;
  congratsTitle: string;
  completion: string;
  accuracy: string;
  averageAngle: string;
  disclaimer: string;
  terms: string;
  submit: string;
  stageComplete: string;
  stageCompleteMessage: string;
  returnHome: string;
  logout: string;
  restart: string;
  selectLanguage: string;
  english: string;
  traditionalChinese: string;
  simplifiedChinese: string;
  prepareInstruction: string;
  demoInstruction: string;
  trainingInstruction: string;
  startTraining: string;
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
    continue: "Continue",
    next: "Next",
    congratsTitle: "Way to go!",
    completion: "Completion",
    accuracy: "Accuracy",
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
    continue: "繼續",
    next: "下一步",
    congratsTitle: "做得好！",
    completion: "完成度",
    accuracy: "準確度",
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
    selectLanguage: "選擇語言",
    english: "English",
    traditionalChinese: "繁體中文",
    simplifiedChinese: "简体中文",
    prepareInstruction: "請按照以下指示準備進行前庭康復練習。",
    demoInstruction: "開始練習前，請先觀看示範影片。",
    trainingInstruction: "請按照示範進行頭部動作，保持在目標角度範圍內。",
    startTraining: "開始訓練",
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
    continue: "继续",
    next: "下一步",
    congratsTitle: "做得好！",
    completion: "完成度",
    accuracy: "准确度",
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
    selectLanguage: "选择语言",
    english: "English",
    traditionalChinese: "繁體中文",
    simplifiedChinese: "简体中文",
    prepareInstruction: "请按照以下指示准备进行前庭康复练习。",
    demoInstruction: "开始练习前，请先观看示范视频。",
    trainingInstruction: "请按照示范进行头部动作，保持在目标角度范围内。",
    startTraining: "开始训练",
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
    countdownReady: "准备好了吗？",
    countdownGo: "开始！",
    placeholder: "请输入文字",
  },
};

export function t(locale: Locale, key: keyof Copy): string {
  return copy[locale][key];
}

export function formatStagePrepare(locale: Locale, stage: number): string {
  const template = copy[locale].stagePrepare;
  return template.replace("{n}", String(stage));
}

export function formatStageStep(
  locale: Locale,
  stage: number,
  step: number,
): string {
  if (stage === 1 && step === 1) {
    return copy[locale].stage1Step1Title;
  }

  const template = copy[locale].stageStep;
  return template.replace("{n}", String(stage)).replace("{m}", String(step));
}
