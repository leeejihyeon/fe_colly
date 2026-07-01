package com.collyapp.config

import com.collyapp.BuildConfig
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule

class RuntimeConfigModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "RuntimeConfig"

    override fun getConstants(): MutableMap<String, Any> = mutableMapOf(
        "appEnv" to BuildConfig.COLLY_APP_ENV,
        "apiBaseUrl" to BuildConfig.COLLY_API_BASE_URL,
        "googleWebClientId" to BuildConfig.COLLY_GOOGLE_WEB_CLIENT_ID,
        "googleIosClientId" to BuildConfig.COLLY_GOOGLE_IOS_CLIENT_ID,
    )
}
