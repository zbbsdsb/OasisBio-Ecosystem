package com.oasisbio.app.di

import javax.inject.Scope

@Scope
@Retention(AnnotationRetention.RUNTIME)
annotation class ActivityRetainedScoped

@Scope
@Retention(AnnotationRetention.RUNTIME)
annotation class ScreenScoped

@Scope
@Retention(AnnotationRetention.RUNTIME)
annotation class ViewModelRetainedScoped
