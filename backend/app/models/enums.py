from enum import Enum


class NicheEnum(str, Enum):
    SAAS_MICROAPPS = "SaaS & Micro-Apps"
    CONTENIDO_TIKTOK = "Contenido & TikTok"
    AUTOMATIZACION_IA = "Automatización & IA"


class IdeaStatusEnum(str, Enum):
    EN_FOCO = "en_foco"
    CONGELADOR = "congelador"
    CONTENIDO = "contenido"
    LANZADO = "lanzado"
    DESCARTADO = "descartado"


class EvidenceLevelEnum(str, Enum):
    INTUICION = "intuicion"
    CONVERSADO = "conversado"
    CON_DEMANDA = "con_demanda"


class InputTypeEnum(str, Enum):
    TEXT = "text"
    VOICE = "voice"
    IMAGE = "image"
    LINK = "link"
    MANUAL = "manual"
