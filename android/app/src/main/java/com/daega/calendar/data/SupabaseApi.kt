package com.daega.calendar.data

import com.daega.calendar.BuildConfig
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray
import org.json.JSONObject
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.util.concurrent.TimeUnit

object SupabaseApi {
    private val client = OkHttpClient.Builder()
        .connectTimeout(5, TimeUnit.SECONDS)
        .readTimeout(5, TimeUnit.SECONDS)
        .build()

    private val dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")

    val isConfigured: Boolean
        get() = BuildConfig.SUPABASE_URL.isNotBlank() && BuildConfig.SUPABASE_ANON_KEY.isNotBlank()

    fun fetchReservationsForMonth(month: YearMonth): List<Reservation> {
        if (!isConfigured) return emptyList()

        val start = month.atDay(1).format(dateFormatter)
        val end = month.atEndOfMonth().format(dateFormatter)
        val baseUrl = BuildConfig.SUPABASE_URL.trimEnd('/')
        val url =
            "$baseUrl/rest/v1/reservations" +
                "?select=id,date,time,adult_count,child_count,infant_count,party_separator,guest_name,seat,memo,color,start_minutes,duration_minutes,created_at" +
                "&store_id=eq.${BuildConfig.STORE_ID}" +
                "&date=gte.$start" +
                "&date=lte.$end" +
                "&order=date.asc" +
                "&order=start_minutes.asc"

        val request = Request.Builder()
            .url(url)
            .header("apikey", BuildConfig.SUPABASE_ANON_KEY)
            .header("Authorization", "Bearer ${BuildConfig.SUPABASE_ANON_KEY}")
            .header("Accept", "application/json")
            .get()
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw IllegalStateException("Supabase 오류: ${response.code}")
            }

            val array = JSONArray(response.body?.string().orEmpty())
            return List(array.length()) { index ->
                parseReservation(array.getJSONObject(index))
            }
        }
    }

    private fun parseReservation(json: JSONObject) = Reservation(
        id = json.getString("id"),
        date = json.getString("date"),
        time = json.optString("time", "00:00:00"),
        guestName = json.optString("guest_name", ""),
        adultCount = json.optInt("adult_count", 1),
        childCount = json.optInt("child_count", 0),
        infantCount = json.optInt("infant_count", 0),
        partySeparator = if (json.isNull("party_separator")) null else json.optString("party_separator"),
        seat = if (json.isNull("seat")) null else json.optString("seat"),
        memo = if (json.isNull("memo")) null else json.optString("memo"),
        color = if (json.isNull("color")) null else json.optString("color"),
        startMinutes = json.optInt("start_minutes", 0),
        durationMinutes = json.optInt("duration_minutes", 60),
        createdAt = json.optString("created_at", ""),
    )
}
