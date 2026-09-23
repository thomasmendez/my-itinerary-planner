import type { FlightBookingTokenResponse } from '../../api/flights'

export const flightBookingTokenResponse: FlightBookingTokenResponse = {
    "search_metadata": {
      "id": "6a9dd1f0ab28c6ff2d7c5cc6",
      "status": "Success",
      "json_endpoint": "https://serpapi.com/searches/A7zhvOD2jlQC1fHBcJSsgs9hPWKyQk-p6GSXRufBbtk/6a9dd1f0ab28c6ff2d7c5cc6.json",
      "markdown_endpoint": "https://serpapi.com/searches/A7zhvOD2jlQC1fHBcJSsgs9hPWKyQk-p6GSXRufBbtk/6a9dd1f0ab28c6ff2d7c5cc6.md",
      "created_at": "2026-09-06 20:49:52 UTC",
      "processed_at": "2026-09-06 20:49:52 UTC",
      "google_flights_url": "https://www.google.com/travel/flights?hl=en&gl=us&curr=USD&tfs=CBwQAhpAEgoyMDI2LTA5LTA2IiAKA0RBTBIKMjAyNi0wOS0wNhoDQVVTKgJXTjIEMTI0M2oHCAESA0RBTHIHCAESA0FVU0ABSAFwAZgBAg&tfu=EgIIAQ",
      "raw_html_file": "https://serpapi.com/searches/A7zhvOD2jlQC1fHBcJSsgs9hPWKyQk-p6GSXRufBbtk/6a9dd1f0ab28c6ff2d7c5cc6.html",
      "prettify_html_file": "https://serpapi.com/searches/A7zhvOD2jlQC1fHBcJSsgs9hPWKyQk-p6GSXRufBbtk/6a9dd1f0ab28c6ff2d7c5cc6.prettify",
      "total_time_taken": 11.47
    },
    "search_parameters": {
      "engine": "google_flights",
      "hl": "en",
      "gl": "us",
      "type": "2",
      "departure_id": "DAL",
      "arrival_id": "AUS",
      "outbound_date": "2026-09-06",
      "booking_token": "WyJDalJJYkZaeVdYaFBUMFpQU21OQlMwcFRhMEZDUnkwdExTMHRMUzB0TFMxMmRIcDJOVUZCUVVGQlIzRmtNRlk0VEROR1dFTkJFZ1pYVGpFeU5ETWFDd2pjcGdFUUFob0RWVk5FT0J4dzNLWUIiLFtbIkRBTCIsIjIwMjYtMDktMDYiLCJBVVMiLG51bGwsIldOIiwiMTI0MyJdXV0=",
      "currency": "USD"
    },
    "selected_flights": [
      {
        "flights": [
          {
            "departure_airport": {
              "name": "Dallas Love Field",
              "id": "DAL",
              "time": "2026-09-06 20:45"
            },
            "arrival_airport": {
              "name": "Austin-Bergstrom International Airport",
              "id": "AUS",
              "time": "2026-09-06 21:40"
            },
            "duration": 55,
            "airplane": "Boeing 737-700 (Scimitar Winglets) Pax",
            "airline": "Southwest",
            "airline_logo": "https://www.gstatic.com/flights/airline_logos/70px/WN.png",
            "travel_class": "Economy",
            "flight_number": "WN 1243",
            "legroom": "31 in",
            "extensions": [
              "Average legroom (31 in)",
              "Free Wi-Fi",
              "Stream media to your device",
              "Carbon emissions estimate: 83 kg"
            ],
            "often_delayed_by_over_30_min": true
          }
        ],
        "total_duration": 55,
        "carbon_emissions": {
          "this_flight": 84000,
          "typical_for_this_route": 67000,
          "difference_percent": 25
        },
        "type": "One way",
        "airline_logo": "https://www.gstatic.com/flights/airline_logos/70px/WN.png"
      }
    ],
    "baggage_prices": {
      "together": [
        "1 free carry-on",
        "1st checked bag: 45"
      ]
    },
    "booking_options": [
      {
        "together": {
          "book_with": "Southwest",
          "airline": true,
          "airline_logos": [
            "https://www.gstatic.com/flights/airline_logos/70px/WN.png"
          ],
          "marketed_as": [
            "WN 1243"
          ],
          "price": 214,
          "option_title": "Basic",
          "extensions": [
            "Seat selection for a fee",
            "Extra legroom available for a fee",
            "No ticket changes",
            "No refunds"
          ],
          "baggage_prices": [
            "1 free carry-on",
            "1st checked bag: 45"
          ],
          "booking_request": {
            "url": "https://www.google.com/travel/clk/f",
            "post_data": "u=ADowPOJjJmwHOgT_J1sU5mf0JVbcKmf2c40Gf0TNmDENo2l7TBXRqWPJ1bc_c8MQJETaYxXF9-LPtdGK5H6-CpJJ0iasQIPcTOqgm-CHjBM-lfBh-09ybM4smTyZ8i07bpv_2RG3ZTDrezjO7AM6-G3t0X48LXhfIeT8HpPnbkpmmkR27n6-4qNvhklCHps0XG8E45KYwf6_GSvCo9ght_kuFLicN5i5amLF59X05CYdKblJ39dU9AutMrub84WwsUDpXQcIHfr5G15N6sFByfPe6uHPtufoG-7ic6Yy75_5pZodPrxMm3S1bqIYsvhPk5a5Wu5oN-BYEwNk26oYEty7eind52cZG35vxpRHhiaLZKcNPWUcPfMUkw4LSaa7COFzJOjPZtrFWlMTUIGfZ5E3lPTPUbMLDngjqTW6Od5D4LjeSe_rzXL8GGioehXQZf4SlFmH2V0oXH-tmGa51AVewJbLF3APFVWcYzMUBiypGFuMVOzpbjHe_Mqa5k-vYw3UF500qyVS_SB5XUORk34dMwhWhoAz0A9L-lKsu3ho41k9rUdVJcIjF7FEUXIM25zt-w2N23MNH3rqBWAjcuE_sc8yvUlj7WbM83RPyjonJUoy1P-ldd3PRcYpm6cUPAkXhbTpx9fBgnqJRHa3e8NbKGnkDdJMgEnQS5uLu3cDpqv1FXAJBlC5-GH-nu76tJDnLOYJ1N0BdNz-iW0eRzNxcb7RJ3xg6YkgACJoVTGv1MAMjma4zz-1IOXiN_r6G9p5_VZUrjdaE-9JGwvWcELvh6gnP289sXhxdM5XpeldJgtZe6PknWuF_1tcB-h3J_9xDrT2APmrH5uD1btnzvfzijErh-ieCqlYhuCjSfx_tgkr2YGr4nuLyXW1NDM28X-Ls6ZGqwNWMDR6ou_wKjZZD1uoNK_35vc_pUsdHB4T_zAE5aSHzzeAjT4yu3wQYxuTvcRyrqnGUQYNxqwznRmqNo7q0lmk1n718FIFmAt8Bq89T7ivneit67k3uo1mYMZyoLthT60nN7piOyYyL3HErGg1lHpIZgY4bVtk6VbL_ZSd0ObCL1bm_iYzkqhIRIVauhGFJWt6ZJAOcQnniI-MrVqXRxBT9xRpYtWaAd33Zap3ECKUMaZKMiHqiL4HaoOlIDe0Z_0ohRECDNWHWNb4-AFoRCD7f-_TP95iZ9_X3WBBmq3vT8QYSadxBdn78wPoNKMeDcMHyqKDc50kb0HYLjaEyitw6D01PBPi01dcrqOnfWJQYs7df0Oo_NurMt6HSOINfU6ZnQiqw8VIsTl1yNykY9KV9wtPqdoY9wazWbUulcAkQ8dGOZJ5jwPKiEsu-UKJ7Ii7HHqTta5bfAvFJryNzhV3BD-4Oy6hHz2ki6f4_IQSAd1ovVmddpZ9EQi5Rk-Jx7edi50yKLu1Iv_8LFOPHHsBLPTUm-gOOZlhtjM7tKot_udHzTNHgdGoE7PBe3Jtd3TH5Ir8HMcwdSf3JI2YJP4-8EzuGNrXoGblawlbsKFwJQ22wWAjoAMdUO-cWRdrSGJ_3cSxC0wizqq0Jycww0oWNG20plJWi6ZuEZ91Rv6YGm54qblfK_fsJ-EbBSHpIEux6PrNVt4Ydphtg-U59oNKqj4bQhMgHXjWgSNaIN-_0wrL_f3_r3M7x3d5x84AUQvnq_55uZDzkTvW2HPYmFk-ATol6N5KtKOXWwdP0WnD4V974-nsRkz5tbCXXj80iaj_foUQPEonVQejEMDxwoaBrQZKOdyBIYiUhmCATuEHQItYRblOIKQtNUbIbvzQBw_UOfHM-YvH6sSFApSs7WsehL04h72x_-RQLO7VaawsO6L7iDXwG-TVtLs5cO3KuJzKqOgJjZfnQxNxD4yiAGQiCRYvnajBkvsW6PvTg-rwZvkJxHG5WFn5ihQnZ-_PxObwQcFJribSupMKWack0Em6cuWkt23Hx9VKNrsn4ucRL2-blEfbR12JdrnQHKGNrq5JoHv_OnimKVLywEJCpXwYNI4SI3VU9ymeErU_W_8LezSUmwRSSQGTq6wc7iFwLiB78nmA_G-K2E0vvucRoh5tT_QMWgWU0VX-SgXoJdMfLMa7ZIG3BXhOrmheM68MpPXlslwnJNpcnks-ilB4uOsYIaS-xDRq1pBX_RDQZMl0Dvuu9117Y247FdITu4uBZ5SNP5FjrwgHam3rwg6gzIrLo0tJml4nAQ0xyzoy0DCSKtCUl1KkSSQlGI_YzAGkj_EoLaIlS-OtnoZWAZjgV4j1vW0lVTnHixQMNjOA-LJ-VSbMyGLGta3iVrAPk7XyC4-C7kKspinaIKpDrsH2IKaN3JjqpOgjoDP5BO0rpYSFhTqUqS2xqKuZ-dzFmrdX8vfNnYea0rnK5A5Cmu9cOFKAuHCDPGOk0isSX4WtyQ4v_mjP5sQyQ2Qh8y0XAriHZuufU6mmX2AMJuBF1n__ztTmWfGBX7av84wx36v8VucUqKB6pj42LEzD6pbtM1_wHOe0Lgk_6uiFVAtu-1n8KjoVf2vplClg6XpgzWCm-VBaAX4cOxzvkGcPtL1klzY8_7Zn3r_oX_JpAVHYuwFOYAOtFEeVzP6ENb6zUmAbUzQ72iif1rjHhCMawxQbaRsRS4a7Hwy5hcFNcjP_i8eAFc0E8BrDF7A2sc-eOrlwNVP88Lm5abj5ENGpvhBZqQokwFlogkR_hQMjub3BuYfzT9nuz4A-pPVaBbICMJiHykLekgFgeLxqhtN-1slWyDQCqVNpEIrwSZ8bgAdJ56op4x3cxpnZPWIlnY6u6mf4FLB-YY1ITh2ytFAeE7-lgcgbzQ9_LxMNpb7iBE1loV6fusJ456l3wtIV67ev4iUIxTH-7fRO62UXG_UPqFn7KwG2sSAaHpfExLt1kuZ2Bm6KU5VTs0KAnTLcrdy9VHQgXECmVQb5Lq0T6pz8XcS2ML_KeJrff-94JzMQGQJUBrx2JMFUerEMfjGOm_8HctdIxQ1n4Cuo911HTDSL68SAwp8eBpZQ7UkJISUWdkqQ3KFFQ-GKg6ZpQ17vbjAoq38RbdmeYh1Ba89Hvw95LtREkwUZ9EQyTyucjmgyA_aGCuPnSEJK0UShCKrtiKq9kYCSaXKl9T4A8PWx3tZspWvswj1QmC2O9wBqdEKzwC-wMZ0Jg0iwKEEg_lmo3Ax7HgipFAdwII7OKxjuQqtp2SGuBiHbGzsav9Z5AoBcK_L5ALwqMp9Qaeh_K4W7dG61OB8wgPfK7sTupCvU9wg6l5TMBNJeUI31dB3qtU0W_-V_oTWy5enWXDo2PqIK2PNtdTXEbR2RzpVl4PbPgPTZUnG-6eQTaIirLVttfnKofmy5F3NpOL_kC1KQXhxp_gbIsPnsQBi8T-XRKVlTeo2ti9BhZHkYUkU77k90IO_zrJUfgumZVmDpJAgPiP4MZXXK3snmgp8khCh36UJhMvpeDxVTx_EJEA9daRKTPDcHm-B6TNISJV8nrS8jpHYACKVaKsCDWTwKNToyIhVhFPyHmqD8YCW-NJ0J87_O_EwBe237TUGC_W31sImCJpLlUoOhZ3V5_NXrReP3YJTl5Z9vzDCfqO2Msiz-cQ4l8Q35TMS5v6_SGPEI2VYpZT44YxL6GYAC3icSKgAXcNo2VZXjfsJ-Hu8t-QH6cN4NS_dV6GcS3XGSsXkDE-oByQB8kNqCfAmWpJG4pa5itfLiCllTketSBRwrBJjBjBO2fyO8VF7zTAeKl6FL_V_iTFNPcH_dk5B1qat4tuI5pI_Mav-Xlfz76Tizkkv0a3UBO-pFRWquZsnW9H-lMpL7eag70vNUg8r5XGwYIsQQefbetl2jry8ofx1G51Lf7hXHHgealfno-WVZlbI8EnC2wtNaZ-gbunMpTE9ooYeHzDobDLTUsVSJ7p2OqajDovwEE4Zfb1OZOcgCE9zcyxwONxrvDyYuKAwOYeL8lJ24fpAZVYuxqA9DuCHdfUf98C1JoTzJ5q2HZHeUTnOe7HyqYdOaMoxRp4tTBc6dc0LaQCtH8T4Rh8uPVvHeXVvvENZVSoudyYSveiBG-u62_5vBYwUA9hG_DevIjgdNtb7V9XYkpGgkv6JZzaJxaMMxX1g5zcmrqnIOYPBMqUbqqShxLtizUinPTNKQ4qRestuRtyK6X-ky44A4CtkLLjQ2cUkTisR11BR6wedR9OnUubdtOLzShagGDxVm5BSmguiMs77siMz-bgQNhvbR1xwe2OmQp84w_Py_c-tchkbLh3PiNCE9cUFY5580M9i0d9jECmc1cBbBOeTvPyn-zcx1yKRcVe8QBh7wjkIvXMChLKZKceVibPxD3B24Zm41GweDrcYJOkh1SfW-fK_r2Yzg9gNvZg0z112S4aOKg7Oa1yKi9hlY0g9tFKKIeIAVQwchldjhP82Z3uqFxOtaM-1o8x5o2-s-bViBEGaI-MK65LxuXgEzCyAGWAvBpuAF2tfcxuZlogK_6e53uwZtZdBhDaTmfc78REvyz_2yLI_QoGXBmksjyElbdE-okhyxFU_lbc4QTGB3ZjLD3TOsKB2-6EACMIeugeB3QUylc-2LWzddkRdaZAQd-Xknn8spwQObwp0BrMYbbz6UjLigG0VT0SfEuvfol0QC2vUChZgbD--ItM_TIASEmXw4soJlEPFIpHb15pXn7BDfv1AtFn4mQtMgcFUYXL35GLt45wvimGhO7bQNDBIHDsiscyB0TBmC405Rpuk_Uszs71maHLHMp6tHbXZUKc39xQ0ggvpoPH5UTRjeUukKL-8LyRu9MQYEzpkdMh2DSCWqoKHqXr0hSAj9ILbqJCdE4MKrLI-_ppx3gvIUexKaaGE2RwAYQ9VuVqVJr2CZi0aOKaTpLxa1l86LVNIWcqIw7flGCCBbue8oR35Jhge3UtaJnca5HWw31Scl7e-_IapyRT7XlnLXaEbMD_i5W_MCBTSF"
          }
        }
      },
      {
        "together": {
          "book_with": "Southwest",
          "airline": true,
          "airline_logos": [
            "https://www.gstatic.com/flights/airline_logos/70px/WN.png"
          ],
          "marketed_as": [
            "WN 1243"
          ],
          "price": 249,
          "option_title": "Choice",
          "extensions": [
            "Free seat selection",
            "Extra legroom available for a fee",
            "Free change, possible fare difference",
            "No refunds"
          ],
          "baggage_prices": [
            "1 free carry-on",
            "1st checked bag: 45"
          ],
          "booking_request": {
            "url": "https://www.google.com/travel/clk/f",
            "post_data": "u=ADowPOKpv9PotY0gUyFYodUL2lxXZ6Hmg8D9hLxniJenh7VRMF4wtUQIqc15h9-oiaoG3lGzrLgox6rUHxRVjiB8NickdftyIOktGE9GTAsA5xEqcWuLTCQHNgXw_4jJScDvbbdri1h8lpgCklhwBabBTiKxuiP1oHCvhYzveBhyVCy212La-BdMIvxo5uVGvi6ixS7RoLSt5qzhyQIl5muNE0HrIgPmszR31v_O6g6VtVvUz6fiCVV1lBDXEL-zg_jh_86kjbxvb20W7uiE_mtSuqlLozynXgKNU84QfBFHsJZWxNrd1Xm8MXPHF3v8DT_1N6BrtYFs2ag4ayg223WOzegbLxCV39MsQu7y1ulr6FNbPQdO0plKFT0Eg_9_KwN6aNeQcrz9ymSZD8gwbyXaYvDXV-oYMPVAFiTFLoGKKahumIYM_T0aZ0r1c_Lf-ErJr8Q_EqHh05s3sSSm67VBXEiY9Z9r80qF9fQEdgWHNqLSDz8Wb7_4cHcfP238KWjN70RELZryRwtZTr4Ws2K24OA-oaS7guoTPZdmwroCLSZ_eO64z6h-swKLKsu4RgTPbyfvxkVEiQTkTBnLYxKhhe30vAFu0M-eAHBPtOPOsqOUB3JO9QeJ7qim6Rf_mgn3stt1s5OkTW37z0N467VlHUa68j0khPqDvwJ1cHDozmXXjviTduCF5AmLSmwQeuNS6yV5Vc6ZwiTorCgS1aYjuM2uFGFl-6inIajW_f1aXzrPVvnNyDKT0c8al5DmqMrzE9GLxm8Q_YpLuWtSTyfA_mFgrN8bHsTAYe8gt6Edqks0ZSDRhvg1wdHCvO5AuktMN7H2-SHNbYQ08CWLPm8qpIuFp9gdNTZDfr6sd6ky1JZ232C6pmK6-BlgFlezQZZJuWh8_Lc_Nop0X2bW3V13vKZSk0mzoll6l_McVGb0hpTWx7leVHwhb8434Ol7CBTEVOZLCz7myERFYMZ3zhsSBY7wM7CYZQw72WHmjdZI6VgEzf_VtocKjDUNdp7if4q-XjY1vsJG0qjq2jtalAzcszylOGTIaFxJQr3lHbJJ_yKvs0wAvUKW4LAo9vGbLSFcXAubcZRa9bekROI6zcwbD1bmu9mWDjOgZUA_W4fgVK1cOywANW_PCNdM9bn11ykqeXcFtix_lUWJGZQlHnz7cGHvhDGvUdtO4ppy3ycHux_-I1g9gx7B5wPdQvsAawKVQiKVblxe0tiTueDrr8TKzVphiEBOP6uN2uMgUFW0LsVWGOVjmLWUc5iHyaoqArltBICHNdCOTC-mEF-1sG9-AsoAC2BTy5f0DXT5Yy3LktiBkdweAqSyN62w_msYvuVNJ17flFvMBkkyKuZSdHchagW1iKXreFfxb2bA9i6RSLTBb1YDVhwresib7QIU8Rh_oGk_ZZE8aYEZHn-cA0fSMGWOyftu1ueQHRu77WFOKQ83XAfgKeo2ojxmvccBZrwLx_Vh5Gkac915Zd6MDLO0xZ14_G8ZQK5T5PH9-uqkJWQuAd3MuWbpWuQnJ8KMaAyRUIkkaMMgxEgCyNVn_GXnazXY-zdqRCVYx1kfR5cZtM3GdjGaZFIT46Ly-BgLlXkgWjBo9TlBet_vLT1rS3fuyT0GQfTjl0wFfB1Kemj-hzv9mhbF5t2LpY0WnlQDG7-Zi8F1zkBROsG2-fPJND2ZlzNEOBBRopKorz7Ex8JOhdt7wMXYF1eDhgntFswbIhsva_vvKCH1ea8iCihMC3RPWUHipLGp7lZsVJCNByOnig7s2Z9ousfMfJ3XRdHhcDCYg3VTqoWdWmrauaYZnDYL9honKOEKpW97WMHbGvs7gdl61FqdBHFbELkOyJWcycIbvnQJlEqOze55rinz4OFCIg3I4GdVwio8sbYaPkdt-0Vm1c6bBrL68r5iWKRbiodadUkdviT58tjKDoSN-adexu91Wu9q8uKinkCdKfJiAizXFT46C28elZh4qjauUT9UWPzZVsrfr_4I5goZg6WyTzKc922YsQyJB126PH-orlLAQpz9ekTKz-uIG5OJ6KYUwg2EDcMWgpkwv2-XrLeehLwDlgdLqVrJDffHUv1I0GBo_tmNgp22g8v9s3kNM7ZBQDZTTA5GqOjN4gudhzUvc6PR2J6gO01yIwXseICEB8BmvHIAAwnhF36QyL3H46WI_h_fJnI9_m1SDhPcygTs4kFAZHE7YaX58RfXcCkczlAQffLlE8H6pgg6C4HgrrMslptebLnkwy8_2Uk5c_cu3lMgCgGahS8bCCiYJ_8Rve06OP6PVPq0RpbR716hrx_D_WIvOA7fEaYqvuvvOtZrSzAM3cIBEnqGQ7R3Zdtr4ppK5NVEinqsy_I3wOqYh66bkcycnvcrmr-CK3t0gxNoa7wRq0CTOVzUS8hCk-xF2PDMkK0v-WSuBzJEpJfk75hUe6djGd-UjpLg4KWOH_bLoAwmmP2ZenUIIyQpZQq3baPLK7KbNiSMLZY2XTw_blAxK3-6GmhsNtQeACKVvqf2-_x-XKc_MVVNgJTqKNWMPSCn_JapX5TSHVPa_TbIVWVplmeb2fDngmTCysW5l8SJE3ZQkORCKnrZgGqamGNA9_wIEs0hvHW7RTtpNmpzMqpkNJIqWPQZ4gz6HK4OEbPAShj9itvD8R0Je3STW248HsbVDKV61oqNnqpyxDpE769fSywv_s8z74C6ytnVUaf0hdIm87DFE8KfC8A1KUynqwwdeYYL4io7m-0PWz0m2Dw_zoYia2qm_-mfqCh9YiAI9hx4x5E23kGYXojDlX5MU4xNmzxiMk72lUA5nayhg31eM9nd9YtY3vuQ61n4H2AIg0AGXAHAT1GDB2GPgCV5EJJEQ_ltK241znOH8qX6gM-q-Rv_XC6sdBGParzLKv3XsY2srlQluOsBcUU1VPeY2HC6MQJISYUv_OZdrGoZXOihPe7_hpoQ28-h8SeRLYxoepNfbdqKz6VY0B0RqakAq49TJ-g9gB61sEgJxQi-7CYcN4bdDewSgXLXBGZXrx7n8Z7-o3bWNplv8RUaVOeN_5gN2g5aLnypkUsfzXHpgFQcd6ICfeHsP2T0Ic0Y3K4UCrHsLX3t8kqR7fKWR94nEXdpuXo0CdH5tLuAT1_mhazPQ4F0kOGgpIvnm6MMylv8HA41Bylq_rmUJqESh59ymqg90FyU109hDN4ZxurPAQa55jj5_0lerRlTw2zzygF82v3UiUemetpfQjc8Zj1lrV1KkDGAdoJIsgtnkBwC6qSu3wRy8BKuH2lBGPQmzdvpWiNlkCThbce5ua_GG8kzpds55ppWWeGrqnyZlWTdN84Zr4pw0QN3ltRQTXrkj9ASMmtoVai04hEba1CARrXzDg9Xj9e4RExsZHdRGpnvY3wNXRkvQvl0_-uEtECvorHbVies3DXSCkp7vC3A9oHL4OmrEFsILL9t_95w0wpTtZxvtSOoa7DfTE76i1faCnqFcyxJhemOAwHwyK1WQ6VqGTZFNbjtSN9Cxdr1QdwcqBO-RhrWkg2Vx8arNc4rlAO7TzYJjDzwNY1x1XiHyFNHG3rqnKGs2sxcgWlzkZy2g8kCrXes3NmuqmQiDVaByxHcnD4C5KA4M80gqtyRoO8chLKxMWUVk-pft-Kd1Oy_rx7GrdYlMYGRHrDNS0RepJJO5TPky_fywgDF5BnJasxrVVsXyRsaN2Tj4pGGRT8hjEw8BMiYFifBoyOCWLZicDfpmL9IwwyVOEF5Dyac0OCWrmX35d8ObF5Stod5iET8FjTrfB7e1DtfaHcI5K3v23TDvLGysQv2lPFIgnM-HW6K_iUvljy3U0EJXtj2t5YlHythuIdRM9RQySJk74XVdnRqzTskYNf_FUCHQ78_4e-pUVJJkt8Lgl0loCSQkBni4B7lZNCl3EvIyIw-WfU2mr6vYVqgG9eS6Pw48J2nP0gC5l4kBKY1DxCr5wn_P7B-8_j_mkS5q34WchX_q3LmJFAbrHp1OC0xmHlfkWxBsZKBEFyphpXm5CGURWAQDYN5cfQG2o3vCysXefJ4OJyGE-EU-6Kk_gAGdzwHw5hm4Ifz3JMq7aUiJoKnYgWIRp8au3LONqAycMDip6qw1NmGaOuRDAF283K_N51zE65u93yKHAYdACUOosYs2Tn2AiLI4XWaZx1wATcSAlNxdShO8m84aKk9hrngAuHY9_2JCBMBIXzhazIXkUeS81kwyAa1LfHnnZLNuOIdYU9Gb2emDawR2lKNqved6fx87g2NKvd8zCOp3XrMVA02IjJ8L4vgmTqeMiUq5Bb7Ds0avVGfM22Zh_fMzAnVrCA_7jBGUGf1ioyBOKPHBvlm3QSyZ2U-_H1u_cbhSkmf7CRSpr7n4jYqpUjeFzW5aRPbRo--D83u7MR2D_Qta3jSG-hN6anwZ_xS_6Y8MQ0r4DrMUfuiOm65q3Ak_tQnugh8fki5FERu0aHiFkbWmzIs6-JNbWm5Uy7pEqtQf_eLksxYn5IrrLCuLrNJe1WLDDXLdRz1E-gYm0M2GJdl9vo9KEH2i7x4NtSCCCSUPLh9Yp4BI7PtVCXoR3_6CVYCM38rMAAM785akiNMhR7BRexJ94tMTUhrnodvW7CN0GnYgAsYYgmrfkQaWUp21uutXItxa6TrLPs3Vm4_Re32PpCnez0E6nsOUHVhvIt4KS1FI81hWdCyvltd__w9-Azkvdjhnn9kbRWu7JjtyvazDD4yVgt-q5p0RL8MbmYPQJRyhh0LiVfmhiH0hJ8GHOia97QJ3btiCbUE1fNeUsap4uwz5bDXVQu5-7Sp8iQE0UfueI7ppvPcwWntYgbwAbdYVGl2U9VPBanQvbXClMX6bARjPMhvsJDxXIM3nCvJzCdBdB2J3VsHO6IpmjTQOKQBnEF-fvR9dLwHczorQBiYUAQJP2GdSirzrmnec4rq_cRzOQvKCupfr_a8blojbtvIpT5zKgNaZxoyuV2oOIju0r3Dh3vrC-ty2xcBkTUyOKbEeelThBdTve6J8ruW_NxQW-d9tr5WslPMVll2zg9ulb68JPYjzsEM1PVlVkj6qJN8XvJJpBXHXEfjOKiI6-VEc9Hc"
          }
        }
      },
      {
        "together": {
          "book_with": "Southwest",
          "airline": true,
          "airline_logos": [
            "https://www.gstatic.com/flights/airline_logos/70px/WN.png"
          ],
          "marketed_as": [
            "WN 1243"
          ],
          "price": 319,
          "option_title": "Choice Preferred",
          "extensions": [
            "Free seat selection",
            "Extra legroom available for a fee",
            "Free change, possible fare difference",
            "Full refunds"
          ],
          "baggage_prices": [
            "1 free carry-on",
            "1st checked bag: 45"
          ],
          "booking_request": {
            "url": "https://www.google.com/travel/clk/f",
            "post_data": "u=ADowPOKM9Xuim0fv5Ajqz7xpVF07P48AHFnRQlpz6J0vZx3UPv8sAw7l1dX72_Gl8Tj7owxkERFZwngKsH0kTlfzhcWxjAHukNZYfWooDLgE3dy1jqrloIsU6sNZiP4nRKX4uEg5IlevRi_0Vziqq7gKEc9QI1CpCEDpq1tQcjksQcEoogZdNZcoLGwdxA0sfcxTpPhAMA5osFePt2Jpo_G8lJid_TQCAlpo04SY5Ws4kizSE5dUV68bjqIRPW3lNIEin0vROwaZZ4UggLT-vyxvuWm-xx2S442SciZuwmV1_7nya7h6hvslv35dsnruQkqOlAj-7SocgHUc5LHZpnVDS_wS9sYC-36Kg_TC7kIGYcwmrwgdF57VFMx_SJ6OiJRBfHpXl3RMdw6TfSJ07wIU7Q8rXfl6NMc7gqAfuDM0ANKoKHFTb3bYjpAKouMdcaN2PyYE_9XSzaxo1tEBetrTObb2itLdtXVrrm4dbvv3jESmDPh3qZDMHx_AYaAxLZHEa-4ElvCFbdfaOB6O5PN1-8b4iLE5e0wlUVO7o4prVjYFOiwkgAxuFDlaCefv5GOQUx7OTwUpdCsD3eTcZl4pTFryVwyreaOOkGYHF_lknUbsIytGJnwqcYx02LpouIY0Ul91Nnb6AOnkr7yviN1LPMFv-TbSJ6YP9y5RWjg419kqNzGJOMbExoqMDJHU3yr75ALpTC6koTv4qnU4LgRydxpbarpavyZXXFGSAw4nOtOtqMT1K5snK_PZ4ii9t_Oucsg6ikaxzNYPq6IfnMzeo12W8O-133ZdV98BV62Q15C-qGrX7TQDmzbx_jp58oAkrCHJ2a-guqEMVAKENEJ899jjGEmWoZhp54RappPFKxphJXWpCi5Rb0SFBNcOpWTZt0VF6fIfPkcyDpW9WDQEhFHpiJrD3ssgtajtpWb_AlP8ssT2yn10gBwATqpf5mDvddArGU6m4j_eE_BJVuKlecmLA-zyfOOWhKZ2F9PKsaK-GaQBUOdpn5HR5v_0Elt-H3bQ8KLok4O23boNeiacen1mQXFNDOfwHAtXKgjzW3_3yP3WKQKwVrRzHukXT6CL6bpO1sreKoYvqN90S9AG0X0hSAeX2WrypUExRnnZwsbl0ZoOzdgite8kNw5eFF43VTsuiopGArK1_3FQDMw1zSLsKWXuDsdSMdOEqTzBpl9uMP3Ps96WnNvFufiydXq5GII84qx7KvEnR2LCZgv_lD_kMQv0xSfpRpAGg8kliXEVEQwsd9yvFaTZwkeWbe845280MagQuiJUoMEOPjuVP4K_GG2sA2QbfxOH9HtLNup9wontdM31sVIo4Yz-LpSPPOHA1A0OVMHtHlQh9Nx00jti2F9FyalMAyzOr2pIs0fY-fKbTCRXKlDWl1QyQOAodmecxOyqYyJCSKjHKLz8j8znvX611B6_5x1IYuv7xrIr15giQLio04i5E1TOPL1GrTgzGLQV65bhe8ESj4ryEP0vB31GszF-vsRZTVpw89uf-XtQn4eHE-Y8kOMw4GBUXkFrcrxrs4lt_VU6XEngrHgEPI00M499uvQApJoxJmEqw2Ru9X2K75QpOTeJgNnBxVDeM_hsNDNdbKc3VzxKbNwIp-i8N4tUfCD1gOGngRb7aPzUrFC_RPMzqjXjpom4fk2iWYPgN4WPhT5r3fwGWvqCkAqRd8tAZosrNLasIi87LEB-NdYyqF6vMEcSH1b1L88FXYiaQOGnaGd8Wzf8hq09IhqGTWGYB_C3NMGE36GxnxEQxsqzEd-PR4il6HfjeaKE2-l1C-Dd79XaZAMwoS9SJuJDAli80rZO-38CQiYgJwq8Fi5PBkCDLPsJwh97x3evQMvuUXzmxYsasuZ1fb00LlP_ZsYsGj_zYoHQSFhZlIpUzBvzn0joU_XlrVCScopxT-XW4ChPEKYDE9MCq1Uth2cEqdRlSo4CgYLJ5gPfFpMc2uFgsL1K6rJrvEkeakeDvr9Bv9iUH8Nx1yUOBRFYBBW0HeAdMYdwQhoVql7i6aU6QI4rW44KlrTUd7W45T2XFT2-fZOyJZjMtFTIr3p4gvtIsu5OtrUx3PnGFw31nBX8laOJFD__2LoFYcnM6exMwrmglfn4By_xL4giaPWOilye4km3MWAJ9H-fDRLEhbQ6UbTYjnAjTflRZA5NiP1JqZKvfLIvRAN6LRlXNGSz8TlCAaqdqlW2IZYdC9DBos6ih0pLXjPP64dBYGc0qPOiBvrWkBZSvsIBUFNDki67PhD6ynvlFMfhclkIuIwt-DyM8YMHYl-rKEc9arpbK9bKmCD_KwlIIfLOf8bavYCuKvgR2PdK-UC_TcRuGjNRExff2c4d8lzqvEB8I5aShudK1wVy5Gs4zNTRPN31WPd9RbEsPl4h0V_0QFfTQhonpu8ULNohRupJsBr8lmnE2C89VNAQQpXT_yeHj3YpsD1EBAqCdbiCLJYzt7KBbSgldHBvaqPuuXrUZWdCQdFemefRTAZPZlWZVuZvGdXFvuzWf_16qNIaMg_J7iFG1m_JqmH3vz4s9Jca1ziD_9fMuLsCgJB0vftySatYcAinfY7T40FE3iVTESeyLhzN9oRsiNGMCygoFtNFGaLeFjM0PHCl4GO6qC5C43zhqdfDvxQAVa5zItl4X1fvjv9qdfoSeezz4cHsm1eIeVKNRfvqD6qpt2J1xIxAPeRsjhdQGrr-D6MPIYfDEbJKAvf2VRp0q-Ia1z_6Ee4V_OLYF4SsXFPOMoqjHeDm85Qg4DzuUdXmtz06q-pRmv4r2fV4djAKFMbpkmZ39yhJXUOOfQwTxs3RxYLZtz4aqmme1hb5O2h-j4tQDXymcLDbPxkG_p2NqbSXoDM-OJXrpYnhNXqcczGsaA5E1pt4u6GTzo72YoCiQzsDCfd_SWKv7eIjcBvtlIwvYIOQjAvzq4OpEJ8abYcKCM2NiOQGZLOzaAzQHwY7gcaHmjp_Wt0HJwCUWO4GG-W8YtwhA8cD68MdSu8nF6mUNKqZz8TcM7De7cNvzLTOhHUEWzx_NH00IHePlFs7MAfT2Xez3t75FhTSr0WdND9_-Lj_F8O6vBTzdXIV0oHUnv0a_e13ECH9AZ3dyq6PS09OrKsmsOnqhXfZKmHdNMy3TbdZvR20zKnTYQA_eygS4nKo3HqFJRf2b5MBfz26hMibRRTafqTcvEzS88njKMfuAzQ0aDP0gNdifTBuRu7DE-EmrEsnqTS0AePl2LU85PKOFTsF0FgE1PWvNIFDmbQ6zE7wXuoyF20Fh8JdMEAhr7yLRANyoh1GS9pq9ApyWJmIzDbZOMFtxjOuxeK0b48lwLh57LgWFEYJ1XIECyWj1ZuWWDA_C_0hcBFjjHnkD2BS7ShgmD2RYc4gH-iEfGBn_DLZ1j6hgbeRWyQY9Kd7QrSR44c9I0V8SBkIkkkVWlyCX37ucm2nh4O8KlCtyhazu43fRoSUholc5vCQgyFMt9QN6hZttY3YRec9kiGkkDhwIqWoTbKzOu0-Zu7yEOAZCkOmcrmbTFCR7Ih-tXPRDnrmt_6eS6Pw2-0AdJMI5SHQHad_rNoE2etWYkeZ9GWjn8CI22_HiYWer4wHJbb020YZrkbpC_mljzt4OmrAhRSR4gbUW1HZnnxCbAIDbvhDvX-zxBvzc0VaQYBGNoXEq2puvgcRDpFmqiik2qLZxlYzpJ-uU32Aa2H6uHWytWCfnGDSjgFDpOSyKaId70rri9dSIgeO7hzZTbpCFktlCuTEJOB9n8TSCR3j3aC1R5Bd_VVaIaooYrjuNztsfbs-thgKD42KMcIc73-syiZK8wZ1fW5ZvUaEWgA4kwToopwFtI1ClPHtdWe3TMqEbEr4s42WSfmftdpSaKqwCvQjaXeC3JiO-nb84yY34fQH9bUq0IhbU84ayvguFEWs-Gedhp_GuwdbIvzOo4vpetnaPhdMdcVkSwLUSW3jQADJMmzhMtMh97ekwg8FZgvO69njwYgrLPXBnPaMtHZ2l3Pfyd_0pHl2sLvkIGbVhGj4y-iIwHGax0e4RWW_sTf3gwMAGCBsrrNsJB-XIYLrTLmnDAApp3pBmlaXhN07YQWCZdMPJjI1BU3cPJSsfo35ZyLMzlMVWpOlSgpB_MK2EFJZlqYr9jdLXDoFK0kHB-grFL1phPhjMqu1ATsY06-x_RbJv6qY4EmTJWxaZALGlrLzWUeqqruY6RyOjzbE8IDHPtDbonjv9Nd3tUhELtQ9chvIxrcKnBlDZaVpKcN3ZbLU4Ho4p8AjhsvNi7wGm7xMcoDYEkZZarRdMqZdtS4niMU3grMbfEuj06Rzp5HMZ0Uq0NyqqhACdS7o-fhioZuRyUAFNwFEpBzwQy12xzXi-dOQrwHFqeFrRRtEZ4-tn98OzT5S0VoiYcailZwAZX4sCrbzEaHQ4_-7b0CsXsuMRdwQ31-CEXnfh_6NLttDMLlrnmv7JfZp-Ac2I-YHFW-0jLHtvQWVfZMi-jMT7A4__ePTfLL9HMjezNVOSQVgAr2s4DNSnnhG_nLX0-LlCswKi4X97SdyyWBGzFkyrv1NOwgQeOsvuiusKkg51LVjQNxTzVBPmT5saj6mbe-kcX6oY4MIFsOM95rovahEA6tBsh1wN9iBOJILiOKZ4SOMJHRZzoxtrm0ZPONaU2sIjaNOTbxpISTWALrji6VID-cvBk7XhJu6yRjimi8kVkRb6Sh3A5zIiqon6pW3jmqkhe8bCQ5dEe8K8_S-Yvcr1lCaeA_bELH6Z27rzJZniAvhQlHghMml0W7uqzCHeDRgUNyatqlPRj0iSaq0LLFFcrXtsvJTKR1f84yFzZsB40-uoZanE90x6Nvkuoe1l9kOIIBjJ_xoJaDtZV25tvVr1vhKJq32vs0Xkn11EFKpNPOfpUaRhzuVg_gnascKomc-ipiMMAzvc5E_2SShlXnDTcRMk8497ZqA0KNMbXOD2iQuu5-grJg2_c3S6zmb-lQ3BxzmFfPiLgaU95d-4lm6Gwq0iapkImFVdR5-u6J6qEzj8EjsM1Z7i6JgfwHhoJwKwCOfvTyL9J7nu7WiS2VAqa2MHc-e2Ovii_pA97mBMDGophfZ5tmJZO3Uqm-ISmN7c4fCmuBJMZfHL_s7ZAdycDotz9Vi4zMpBzufLUXn2AKs0ii4505C1Y2-Avoqkc0XMsz_OEtT7gB73dRA_5_6_PUbDkIhfK3_4ZOIGuDjqx0E_ZJuAFk1UTCX3MSlHZUlirG21hVw_EPJFOh1hM4rZujPRf2zt3YrCPI"
          }
        }
      },
      {
        "together": {
          "book_with": "Southwest",
          "airline": true,
          "airline_logos": [
            "https://www.gstatic.com/flights/airline_logos/70px/WN.png"
          ],
          "marketed_as": [
            "WN 1243"
          ],
          "price": 359,
          "option_title": "Choice Extra",
          "extensions": [
            "Free seat selection",
            "Extra legroom",
            "Free change, possible fare difference",
            "Full refunds",
            "Complimentary alcoholic drinks"
          ],
          "baggage_prices": [
            "1 free carry-on",
            "2 free checked bags"
          ],
          "booking_request": {
            "url": "https://www.google.com/travel/clk/f",
            "post_data": "u=ADowPOIicCeDuh9i_H5xpyaOq51j90ghemfXmtJJCFPKDERdwbXSSh0786D5aNNVLSDTixPPZl96s7G6m6_P_EopTkUG9JClHsztiKDQRX3vkLDmeH1ZbnFDQIIz17DO4pPfg16OjnECrH1PBUcegLOWLbaZt_Bq6ChFH_ESj-iUudBjiVHYrlowOqZ4QXg-qB9nOyPd0WamPVVqFyMg2oKWNsof17FP4nkpjsln3Zc2j-zyfmJ7kdo9IakpjcPJbnJqRBEnqj1EbmQpM8ncHUz6JKG5B3Ypw4EA9sFQQLTtAciokCx9Gj0LfJLnuw5m_duxWkeLYY06b01reyAReFABwBojZNMzYuops3lLXBKd-2jWstfvdnyGXQtUqog3ylU0t5kmQxFwEgG7gE1On4xiEML8SUZA9-GJZxiYSt45WfJ9t416kf5cdSlStkO3c-n3R_F_6ueYucv-M0sfXaXoDRWkTJJUYjoeUE6UsVX5pD2ONcM2sdObew6PXI9nb00NhB3IeJetpI5VQ1Sg4Zfp53k_KArf6iOH1bVDKZlvD3F3mTgHTA55p8ikdVqnggx2yw4efV6BVlJ_LH8aceSXxUL9cFa45KDHKRLoiSeSePRdA4FZvZnPuYJAg_R95Mgd3nYF0isPJrIWO6k141hY6Q0ABhyBDR1LHjd6E8tbzd8faQ9tpS3vuQZanZXzGFco7NGZ1xH0KHLu3kWUbzM1vTNLZWPpSOXCzoRFLPo0g1r9SGo5XNi28UfkMvoLQMol94QdND4t1bPb1_Ffa2SKEjSKEANeNZB9mIXYRahKXhC8kX2AGnOYbzH1sbBTs7BdbBGzHmDVKCFvPsFdyEgB_0-SG_EL5d9CU_RVBrp_38tMnlrP125X4nIgxKyVyiEkW4ZWV4SKYVk-bNoKkXFH1XfV6iZquJBEWY_4TpNrX5DEq6IypOngUT2TlLMwXXsjRRB41SgnZfQVLfGsKdcQrLjwMNqPnl3dF6p78QE0Q7JhODsNgkH9Zs4O0TyO98kM-LeI3rwdypWuJ_ImIXwru0_MdyRNL2ZDv-X4cf3ZLRx9lExe006e7rWYXcqGh8OPKbtwJ4VlPJ17t1rJf4QzdhJntMgwKl4L4YS7mypJFQGbRkuNVBoAcaq16z8vqDa_GfqqnK_rG6wVdbbKXq8c4mlNS5NPKdeE3CzInNFdlLj9v-xA2qy2KqxV4S6OnUH3Y4CUcEkmCGocmOE0tWco5rqt5dDNoS6aCPDC2OakhlyLkgT5MnYNJvXjgnwTWFqMMWdu3TgB2ufd776r4cfCUX7-0Q4m90hnlAl4ZGP4Gs9n1vV8TqLWDPByXJcGZSjpoEyrno0G6n8P8RPlxPlkXedaxuKUtkHwbn-I9kaKyBsIXDNV2iEpjxI34GiVhICLcS7G_KdiURioWA-zLpSOadyo7irUjcbfNy4jQhVQWCR8MJH6lHJMdKv0onkGkOom-M_N6_4-4tGoBqQA_JeZYFYWdxrl6Uml7GljdLndO4u52mMVfTri6aHjADVd1cM5MFRfnxNj7FHKi81e9ri04jiy16PIN_BqTLYV0uchErroGGxb_5fAdCITTmq3Lj1nolMmmxsOJ-zAEd56ojOAEXiBALbUx4I7LUQgcYKv3gsoBgyR-6wwz8DXUdqN_F-w_pXwVvR0cNZgp_4LknjfAfO0h49zY_4qU1yoGAuApf9whXq8TFsWzSr-DKAGAZ7gKH5KfiOHhu7uz2Oghs93PqiSk_KlpBFlo242cIiw0Gsd1wZ5INOWwaP-KLt2cYPWBRPAsAKUvFh9_bUNrc2E3Ef8nhUgC-KMuGN5JDYETLU01B4JxxVggIAfyPUJ9_P1SDK2LKbPsrKdqnf4gH92uzeQ96B4eAKCSg6a2uZe9SWCqs7pHUqS3SRY4QW4uuigdyggS09SpsVfP2eJw1ya1dy1BrBGqtUXZ9Ot3834eVOClL42WSbrrczPIuv1o90lu8tlLO65G_dn5YWZVrM9W8dBjl2-3gSGfKiYadH1uoO7CnriKtoeepQ8OESb7CVhSjkf47b0TMkjGO0V4mm50fPgqv2yTDjzcJa8hOxhUSAbzEfFMFRHfE992zA0nsQ1vTGGhoaJ7nciXL_qLB9Yd5J6oq__yetblqh4jKBSmUJERyc39LWb1hyOq5KtJeTewXW7RY5ucMCVy1-ubUUlrb8KsfVwyKGd2gSYUEDtdwwjLJCbrb5DdCIzuRzHKlWcLt2bKLxG2XgX4RWs3zCs1AYahrUJ9WCq-NXuHuHeUWQsmYYcWTjWFwgipd7IaCUQnZrjWl-d3likUmhcPMcwfnknZDrJZjqN6Pm3aWGwka85l7Z2ydBdiRXg3wG1IYAldN_X5dSVal61BsEIEK2qfkpStMZ3VArYf-44V9oVARh7VkMwdPexPP-WIqZaDjSB-pANAmUA7trZ9H7-oQWL04KUXfy54vFP0c5MrWTVui9a-jmc2HrpPvH71XuR1b9USL7eolw_cNKJgKDwN4ulFhnZai1TO9uwC81VM0sfVnQkmc88stVpqbOYrLBi9iHoNTS8DYXCdXfrYwxbzXpZoGLDeQBt_Oa3U7zRwXMM5bfQXE4uZFhwYFOgpnrVZOBW-nDHcWS0-3G2aZcYjlXodBHlL3Cvs_FPwzIeYtKQCx3EbsDwNFGt_8Quxq2Pc1GA_PMcXyShj_S1TF6elUDPMsjvVjtGmjIuoIaAkH9y_rXyW8ojk4sl7FLMeFJXhQFuGILGRHNl4abJECxPGHfdN-fP5kc-iTmMmeb8AiMb8j5x3seE_XWZP-eQGZgzoZgL1gkjvRswWtHuzlJ1gJ9ZAew2VsOtPRfwyjy0SIFIks4A9OmsjnvW_y9lfOa8yQIWa5-gzWez-b5E5Bk8_WLC0Uwbr7R3vzNmxvzovv_cYCxp_nORiYTjtuHGK9BTAgmsA5W6-sGF8UKB5qWTNI_taQ3klaeimNgEvTOYdPkBbdyCpqy6WFS7eNBmUX97p-lA3jpDwjSWkB5ghmEJc5czmyI5EsMqVgA90Z9c0OKPHLqJ1yRpuU4LoAic0I1UTfl3tJtDXzYbVt2oTRUbezTa6qaGTg87ZDwPyBBPgHjQ9wSKqXZjsIG2Jt0iWry_DhVB3N15cfd-9sE7n2UYy70CcDNNW3rVyUMV5sQT8dzCC1bEAZloxIGx89jqpjyU2DqDEPSsyVxU-0lY2uMK7YWs1h2vN-3eOPu2MKCYoOl7c6MdajS0zFyA0HxAwWb6yGHcdQZBuUc5eprvwAgL7PPSBXo3GMF-6k7D3RO5cPInPtw9oUbJYo-gnbMbyjo0zeaqxa3lhlbFCFknu8_7fYIczH79Q5lwOr_fukBV2E3eofjesfivyoOQC9Ezm-8bNALem01fgE1dzxJtL955UtlFzCsSUNd5L5EbjPPYHJU8NKo90db_lGPG-nC7WgTNiTbCrdFRy_JnTC_oSTVWmMcvHC1TsOKQXaYqNM6ccdCsb3pCXpmJCXzenXhoqNuvZQfjyxHFrtDOTqvkBroG_BZ-KU5bHHI4RJszsly4YdHHFGw4xGFJC6Tlfp7mbuEl09kEsZ8OtuSk6lKQ9QIDaH5-MjJTA3G8MG1iOrQkgC_K4GOok7S4LIClklXvuJaNvn-640dV5IUpJq5Mb-efmaDvGzVC8DX6K6KnTp_jgt7wp2fSziglhTNbojjtCCKM0GG2ienapb-D0-w0vbk3N_paJ9LFXFhiZfKpQWuV2j4eZJMFQXY-CLEnIlRQh4t99Y3CCLclddXjgVl8qQW-Dws-YSb3cB_GyEVY9Cthc9EadMKdPNuxNkCFCEXZ1KO8JDMZOBtjt0nyeBEy494xRp62vuvRGnCrv0nC3-OAj_4-1IM1WPH5mYidmim_MrNtORASdIAnUsWOE1-u-eMkgafH6OURP_VJ5gAOjekgzaomeEiax4RUIM3TVZCa9OJu16eMFh3lkJUT7YJ_91xx9yW7VFzwd91lvE5-qmtaqTrXOPtnR1Bd2z5LfzX2L2FKA-vRUfKJOc8a3hWy7E8khh46OTH8Y6KRFNX2eEQ3GAbilmUdFjNFfPMNdQdBqraVDxGwFTNgP6oRZhoCBmB8VfNxPOK47MYwJEcNNoLUIX64RPXGFq3A4pZ6sMLQzrnH6c64T5XN_kazzrBAPvC_n0NmtH0D5X_AdiDxvYcdMsvcO7Q3nuJokUmsFn4yF9cV9W0mth6bdWB-fMLJ8EHmiIt0paxUbvcJ53NfDwE0XRRlsxEQlIqsSisf2bMwwhsLOGmdNamxuvz9ZRimCD6e-TDlbozocOPuOn8YIQ59tUaA76SmZe-uF3mHYGmiDf_aR8BlsgUSmkluChf4NZkWLvv0lHq8VNefSRMMPNT_rGhnkNJTAXbjtGfCsTiGXow7gdbslvQdKXZIjhXDmhMzW9HCXjOmtgu_OUpqjtJ048ah3WTYYcEPVD2vRtcJWX5hmbnHiM9ahhNyCW_3nr_QHbXe9eyBj9-LdwVU094UuzFlUBD5oLIeeLdDjVgtUcZO1In-BfBtk8abK82epDCCazTmV713CIZbg0vjpams8BhxFWQUzYpBluzXR8EdNtB7SSgQK1_AJy0wJsHMcidnqPKI25f9G9xoVMGChnGSIBeoR6mD37cjdzmoVoOwTz8ctjOmvEdf8c3ywYzWGrVuYtCGyGvuWt-is7Fp4EozfvW7-POdCWU7RaUq5RV9jifWfmWyTNhi0WwjtVpuqSaoRaQmRWlqzR1tXG7SUX_KWMlKLltCPOriDsA4yTbU8gFkQ9zB2p4A_-na0t524qTguhaAdBKrL8LHWXAuNSpCbwS2Fstib5hpwQsUmPXk9i2-jAf8kq6ZoyenPMHKVrmWWN9du1rJnMFDnYlPNT4aSqGNi7aApmD-0zt6uE-PwoCHf1EmLOXUXA5P3fo3lntiVH59zLZX4efbjNzPcDyHNcAWSMz-c_wLWfX0BzwQDY4YcFcF95jkBhcAwRFotX-XG9wYV4T2i6rBQdt408ErbvYJ6ndoisCRVPsO0R4JALxpGvePAp2_uY7S9WySsY9tHmAXTthLA77jRG_edQdq0HrL3Fwqqrtr9QOHurvgoG6rh4DutOCTI_6rzNo0kkbU8ZCaqF4j-VmSNZ0zck1g_iI9JGtCTXKHBiNwX8q7ZHpZFQnL9qZsk7rUKuhjSS151QdxKbfP4cUuya4kAhHPeQ"
          }
        }
      }
    ],
    "price_insights": {
      "lowest_price": 214,
      "price_level": "typical",
      "typical_price_range": [
        75,
        230
      ],
      "price_history": [
        [
          1783486800,
          180
        ],
        [
          1783573200,
          180
        ],
        [
          1783659600,
          180
        ],
        [
          1783746000,
          180
        ],
        [
          1783832400,
          180
        ],
        [
          1783918800,
          180
        ],
        [
          1784005200,
          180
        ],
        [
          1784091600,
          180
        ],
        [
          1784178000,
          169
        ],
        [
          1784264400,
          169
        ],
        [
          1784350800,
          180
        ],
        [
          1784437200,
          180
        ],
        [
          1784523600,
          180
        ],
        [
          1784610000,
          180
        ],
        [
          1784696400,
          174
        ],
        [
          1784782800,
          185
        ],
        [
          1784869200,
          185
        ],
        [
          1784955600,
          174
        ],
        [
          1785042000,
          185
        ],
        [
          1785128400,
          185
        ],
        [
          1785214800,
          185
        ],
        [
          1785301200,
          205
        ],
        [
          1785387600,
          174
        ],
        [
          1785474000,
          174
        ],
        [
          1785560400,
          185
        ],
        [
          1785646800,
          185
        ],
        [
          1785733200,
          185
        ],
        [
          1785819600,
          185
        ],
        [
          1785906000,
          185
        ],
        [
          1785992400,
          185
        ],
        [
          1786078800,
          185
        ],
        [
          1786165200,
          185
        ],
        [
          1786251600,
          185
        ],
        [
          1786338000,
          185
        ],
        [
          1786424400,
          185
        ],
        [
          1786510800,
          211
        ],
        [
          1786597200,
          204
        ],
        [
          1786683600,
          211
        ],
        [
          1786770000,
          211
        ],
        [
          1786856400,
          225
        ],
        [
          1786942800,
          211
        ],
        [
          1787029200,
          211
        ],
        [
          1787115600,
          174
        ],
        [
          1787202000,
          167
        ],
        [
          1787288400,
          159
        ],
        [
          1787374800,
          159
        ],
        [
          1787461200,
          159
        ],
        [
          1787547600,
          189
        ],
        [
          1787634000,
          189
        ],
        [
          1787720400,
          189
        ],
        [
          1787806800,
          199
        ],
        [
          1787893200,
          199
        ],
        [
          1787979600,
          199
        ],
        [
          1788066000,
          199
        ],
        [
          1788152400,
          214
        ],
        [
          1788238800,
          214
        ],
        [
          1788325200,
          214
        ],
        [
          1788411600,
          214
        ],
        [
          1788498000,
          214
        ],
        [
          1788584400,
          214
        ],
        [
          1788670800,
          214
        ]
      ]
    }
  }