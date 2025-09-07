import os
import time
from datetime import timedelta
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env(
    DEBUG=(bool, False),
    DJANGO_ADMIN=(bool, False),
)
environ.Env.read_env(os.path.join(BASE_DIR, ".env"))

SECRET_KEY = env("DJANGO_SECRET_KEY")
DEBUG = env("DJANGO_DEBUG")
DJANGO_ADMIN = env("DJANGO_ADMIN")

ACCEPT_RESUME_FILE_TYPE_UPLOAD = env("ACCEPT_RESUME_FILE_TYPE_UPLOAD")

ALLOWED_HOSTS = ["*"]
CORS_ORIGIN_ALLOW_ALL = True
CORS_ORIGIN_WHITELIST = ["*"]

DATETIME_FORMAT = "Y/m/d H:i"
ASSETS_ROOT = os.getenv("ASSETS_ROOT", "/static/assets")

DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = []

LOCAL_APPS = [
    "apps.resume.apps.ResumeConfig",
    "apps.overview.apps.OverviewConfig",
    "apps.dashboard.apps.DashboardConfig",
    "apps.detailed_profile.apps.DetailedProfileConfig",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

if env.get_value("DATABASE_URL", default=None):
    DATABASES = {
        "default": env.db(),
    }
else:
    DATABASES = {
        "default": env.db_url(
            "SQLITE_URL", default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}"
        )
    }

MEDIA_URL = "/media/"
TEMPLATES_DIRS = os.path.join(BASE_DIR, "apps/templates")
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [TEMPLATES_DIRS],
        "APP_DIRS": False,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "config.context_processors.cfg_assets_root",
            ],
            "loaders": [
                (
                    "django.template.loaders.cached.Loader",
                    [
                        "django.template.loaders.filesystem.Loader",
                        "django.template.loaders.app_directories.Loader",
                    ],
                ),
            ],
        },
    },
]

STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")
STATICFILES_DIRS = (os.path.join(BASE_DIR, "apps/static"),)

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Ho_Chi_Minh"
USE_I18N = True
USE_L10N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "format": "[%(levelname)s]%(asctime)s:%(pathname)s:%(lineno)s: %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "standard",
        },
    },
    "loggers": {
        "default": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": True,
        }
    },
}

APP_START_TIME = str(int(time.time() * 1000))
