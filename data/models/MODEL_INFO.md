# Qwen2.5-1.5B-Instruct GGUF Model

## Model Information
- **Name**: Qwen2.5-1.5B-Instruct
- **Quantization**: Q4_K_M (4-bit)
- **Size**: 831 MB
- **Format**: GGUF (llama.cpp compatible)
- **Architecture**: Transformer
- **Parameters**: 1.5 billion
- **Context Length**: Up to 32K tokens
- **License**: Apache 2.0

## Device Compatibility
✅ **Infinix Hot 11s NFC**
- MediaTek Helio G88
- 4GB/6GB RAM
- ARM64 architecture

## Performance Expectations
- **Inference Speed**: ~2-4 tokens/second
- **RAM Usage**: ~1.5-2GB
- **Storage**: 831MB
- **Best for**: Task management, NLP understanding, chat

## Location
```
/data/models/qwen2.5-1.5b-instruct-q4_k_m.gguf
```

## Usage
The model is automatically loaded by the app when:
1. App starts
2. User enables "Offline AI Agent" in settings
3. Model file is present in the models directory

## Alternative Models
If you experience performance issues, try smaller models:
- Qwen2.5-0.5B-Instruct-Q4_K_M.gguf (~300MB) - Faster, less accurate
- TinyLlama-1.1B-Chat-v1.0-Q4_K_M.gguf (~600MB) - Good balance

## Download Source
HuggingFace: https://huggingface.co/bartowski/Qwen2.5-1.5B-Instruct-GGUF