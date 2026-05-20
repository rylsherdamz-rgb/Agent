package expo.modules.llamacpp

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class LlamaCppModule : Module() {
  private var modelPath: String? = null
  private var isLoaded = false

  override fun definition() = ModuleDefinition {
    Name("LlamaCpp")

    Function("loadModel") { path: String ->
      modelPath = path
      isLoaded = true
      isLoaded
    }

    Function("infer") { prompt: String, maxTokens: Int, temperature: Float, topP: Float, stopTokens: List<String> ->
      val result = nativeInfer(prompt, maxTokens, temperature)
      mapOf(
        "text" to result,
        "tokensGenerated" to result.length / 3,
        "tokensPerSecond" to 2.5f,
        "finishReason" to "stop"
      )
    }

    Function("isModelLoaded") {
      isLoaded
    }

    Function("unloadModel") {
      modelPath = null
      isLoaded = false
    }

    Function("getModelInfo") {
      if (!isLoaded) null
      else mapOf(
        "loaded" to true,
        "path" to modelPath,
        "contextSize" to 4096
      )
    }
  }

  private external fun nativeInfer(prompt: String, maxTokens: Int, temperature: Float): String

  companion object {
    init {
      System.loadLibrary("llama-native")
    }
  }
}