package com.daega.calendar.data

import androidx.annotation.DrawableRes
import androidx.glance.ImageProvider
import com.daega.calendar.R

object ReservationColors {
    fun chipBackground(colorId: String?, inCurrentMonth: Boolean): ImageProvider {
        if (!inCurrentMonth) return ImageProvider(R.drawable.chip_bg_muted)

        @DrawableRes val bgRes = when (colorId) {
            "yellow" -> R.drawable.chip_bg_yellow
            "green" -> R.drawable.chip_bg_green
            "pink" -> R.drawable.chip_bg_pink
            "purple" -> R.drawable.chip_bg_purple
            "gray" -> R.drawable.chip_bg_gray
            "sky", null -> R.drawable.chip_bg_blue
            else -> R.drawable.chip_bg_blue
        }
        return ImageProvider(bgRes)
    }
}
