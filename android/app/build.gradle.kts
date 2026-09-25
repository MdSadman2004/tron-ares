plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.ares.grid"
    compileSdk = 35

    // Upload key: never commit the keystore, never use the debug key for Play.
    signingConfigs {
        create("release") {
            val ks = rootProject.file("keystore/tron-ares-upload.jks")
            if (ks.exists()) {
                storeFile = ks
                storePassword = "V0zQiTNTzqneZZ1hXX3amSDO"
                keyAlias = "tron-ares"
                keyPassword = "V0zQiTNTzqneZZ1hXX3amSDO"
            }
        }
    }

    defaultConfig {
        applicationId = "com.ares.grid"
        minSdk = 26
        targetSdk = 35
        versionCode = 2
        versionName = "1.0.1"
    }

    buildTypes {
        debug {
            isMinifyEnabled = false
        }
        release {
            isMinifyEnabled = false
            if (rootProject.file("keystore/tron-ares-upload.jks").exists()) {
                signingConfig = signingConfigs.getByName("release")
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

    packaging {
        resources.excludes += setOf("META-INF/*.version", "META-INF/*.kotlin_module")
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.webkit:webkit:1.11.0")
}
