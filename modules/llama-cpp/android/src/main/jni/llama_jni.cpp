#include <jni.h>
#include <string>

extern "C" JNIEXPORT jstring JNICALL
Java_expo_modules_llamacpp_LlamaCppModule_nativeInfer(
    JNIEnv* env,
    jobject /* this */,
    jstring prompt,
    jint maxTokens,
    jfloat temperature) {

  const char* promptStr = env->GetStringUTFChars(prompt, nullptr);

  std::string result = "Offline AI response. Prompt length: ";
  result += std::to_string(env->GetStringUTFLength(prompt));
  result += " characters.";

  env->ReleaseStringUTFChars(prompt, promptStr);
  return env->NewStringUTF(result.c_str());
}