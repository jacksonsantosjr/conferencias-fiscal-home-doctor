"""
Classe base para adaptadores de parsers municipais e utilitários de leitura resiliente de arquivos no Windows.
"""

import os
import tempfile
import shutil
from abc import ABC, abstractmethod
from typing import List, Dict, Any

def safe_read_bytes(file_source) -> bytes:
    """
    Lê o conteúdo binário de um arquivo de forma resiliente.
    Caso o arquivo esteja aberto no Windows (ex: Microsoft Excel), contorna o bloqueio de arquivo.
    """
    if isinstance(file_source, bytes):
        return file_source
    if isinstance(file_source, str):
        try:
            with open(file_source, 'rb') as f:
                return f.read()
        except PermissionError:
            tmp_path = os.path.join(
                tempfile.gettempdir(),
                f"temp_audit_{os.getpid()}_{os.path.basename(file_source)}"
            )
            shutil.copy2(file_source, tmp_path)
            with open(tmp_path, 'rb') as f:
                content = f.read()
            try:
                os.remove(tmp_path)
            except Exception:
                pass
            return content
    elif hasattr(file_source, 'read'):
        try:
            content = file_source.read()
            if isinstance(content, str):
                return content.encode('utf-8')
            return content
        except Exception:
            return b""
    return b""


class BaseCityParser(ABC):
    def __init__(self, city_name: str):
        self.city_name = city_name

    @abstractmethod
    def parse(self, file_source) -> List[Dict[str, Any]]:
        pass
