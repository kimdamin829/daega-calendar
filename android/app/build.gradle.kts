import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

val secretsFile = rootProject.file("secrets.properties")
val secrets = Properties().apply {
    if (secretsFile.exists()) {
        secretsFile.inputStream().use { load(it) }
    }
}

fun secret(name: String, defaultValue: String): String =
    secrets.getProperty(name)?.trim().orEmpty().ifEmpty { defaultValue }

android {
    namespace = "com.daega.calendar"
    compileSdk = 35

    defaultConfig {
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        buildConfigField("String", "SUPABASE_URL", "\"${secret("SUPABASE_URL", "")}\"")
        buildConfigField("String", "SUPABASE_ANON_KEY", "\"${secret("SUPABASE_ANON_KEY", "")}\"")
    }

    flavorDimensions += "store"
    productFlavors {
        create("suncheon") {
            dimension = "store"
            applicationId = "com.daega.calendar"
            buildConfigField("String", "STORE_ID", "\"main\"")
            buildConfigField(
                "String",
                "PWA_BASE_URL",
                "\"${secret("PWA_BASE_URL", "http://10.0.2.2:5173")}\"",
            )
        }
        create("branch") {
            dimension = "store"
            applicationId = "com.daega.calendar.branch"
            buildConfigField("String", "STORE_ID", "\"branch\"")
            val branchPwa = secret(
                "PWA_BASE_URL_BRANCH",
                secret("PWA_BASE_URL", "http://10.0.2.2:5173"),
            )
            buildConfigField("String", "PWA_BASE_URL", "\"$branchPwa\"")
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
    }

    applicationVariants.configureEach {
        if (buildType.name == "release") {
            val url = secret("SUPABASE_URL", "")
            val key = secret("SUPABASE_ANON_KEY", "")
            if (url.isBlank() || key.isBlank()) {
                logger.warn(
                    "Release build: SUPABASE_URL/ANON_KEY missing in secrets.properties — " +
                        "widget will not show reservations in the APK",
                )
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.webkit:webkit:1.12.1")
    implementation("androidx.work:work-runtime-ktx:2.10.0")

    implementation(platform("androidx.compose:compose-bom:2024.12.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")

    implementation("androidx.glance:glance:1.1.1")
    implementation("androidx.glance:glance-appwidget:1.1.1")
    implementation("androidx.glance:glance-material3:1.1.1")

    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")

    implementation("androidx.datastore:datastore-preferences:1.1.1")
}
