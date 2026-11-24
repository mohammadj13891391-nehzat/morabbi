plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "ir.nehzat.morabbi"
    compileSdk = 35

    defaultConfig {
        applicationId = "ir.nehzat.morabbi"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "4.0.0"

        buildConfigField("boolean", "IS_DEV", "false")
        buildConfigField(
            "String",
            "SERVER_URL",
            "\"https://morabbi.nehzat128.ir/app/index.html\""
        )

        ndk {
            abiFilters += listOf("arm64-v8a", "armeabi-v7a", "x86_64")
        }
    }

    signingConfigs {
        create("release") {
            storeFile = file("../morabbi-release.keystore")
            storePassword = "morabbi123"
            keyAlias = "morabbi"
            keyPassword = "morabbi123"
        }
    }

    buildTypes {
        getByName("debug") {
            isMinifyEnabled = false
        }
        getByName("release") {
            isMinifyEnabled = true
            signingConfig = signingConfigs.getByName("release")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
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
        buildConfig = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.swiperefreshlayout:swiperefreshlayout:1.1.0")
}
