#!/bin/bash

# Model Download Script for Infinix Hot 11s NFC
# Best models for devices with 4-6GB RAM

MODEL_DIR="./data/models"
mkdir -p "$MODEL_DIR"

echo "🤖 Downloading optimal GGUF model for Infinix Hot 11s NFC..."
echo ""
echo "Device Specs:"
echo "  - MediaTek Helio G88"
echo "  - 4GB/6GB RAM"
echo "  - ARM64 architecture"
echo ""

# Recommended model: Qwen2.5-0.5B (best for 4GB RAM)
echo "Downloading Qwen2.5-0.5B-Instruct (Recommended for your device)..."
echo "Size: ~300MB | Quantization: Q4_K_M"
echo ""

curl -L "https://huggingface.co/bartowski/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/Qwen2.5-0.5B-Instruct-Q4_K_M.gguf" \
  -o "$MODEL_DIR/qwen2.5-0.5b-instruct-q4_k_m.gguf" \
  --progress-bar

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Download complete!"
  echo "Model saved to: $MODEL_DIR/qwen2.5-0.5b-instruct-q4_k_m.gguf"
  echo ""
  echo "Model info:"
  ls -lh "$MODEL_DIR/qwen2.5-0.5b-instruct-q4_k_m.gguf"
else
  echo ""
  echo "❌ Download failed. Please check your internet connection."
  exit 1
fi

echo ""
echo "Alternative models you can download:"
echo "1. Qwen2.5-1.5B (if you have 6GB RAM):"
echo "   https://huggingface.co/bartowski/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/Qwen2.5-1.5B-Instruct-Q4_K_M.gguf"
echo ""
echo "2. TinyLlama-1.1B:"
echo "   https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"