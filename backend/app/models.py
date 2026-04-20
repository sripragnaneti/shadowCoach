import os
from functools import lru_cache
from faster_whisper import WhisperModel

@lru_cache(maxsize=1)
def get_whisper_model() -> WhisperModel:
    model_size = os.environ.get('WHISPER_MODEL', 'small')
    device = os.environ.get('WHISPER_DEVICE', 'cpu')
    compute_type = os.environ.get('WHISPER_COMPUTE_TYPE', 'int8')

    return WhisperModel(
        model_size,
        device=device,
        compute_type=compute_type,
    )
