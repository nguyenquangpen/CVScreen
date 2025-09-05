from django.conf import settings


def cfg_assets_root(request):
    return {
        "ASSETS_ROOT": settings.ASSETS_ROOT,
        # "page_size_options": settings.PAGE_SIZE_OPTIONS,
        "APP_START_TIME": settings.APP_START_TIME,
    }
