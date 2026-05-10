package com.oasisbio.app

import android.app.Application
import timber.log.Timber

class OasisBioApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        if (BuildConfig.DEBUG) {
            Timber.plant(Timber.DebugTree())
        }
    }
}