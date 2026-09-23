class SerpApiNotConfiguredError(RuntimeError):
    """Raised when SERPAPI_KEY is unset and a search doesn't match the one recognized
    demo/fixture param set — i.e. a real search attempt with no key configured, as
    opposed to someone intentionally clicking through the "Try it with no keys"
    demo flow."""


# Mirrors frontend/src/mocks/data/flights.ts's googleFlightsSearchResponse - keep in
# sync by hand, no shared build step between the two package managers.
_STUB_SEARCH_METADATA = {
    "id": "6a6a91068270313771b49302",
    "status": "Success",
    "json_endpoint": "https://serpapi.com/searches/6OyZ-5lsBH_tfV7_ron71Q/6a6a91068270313771b49302.json",
    "created_at": "2026-07-29 23:47:18 UTC",
    "processed_at": "2026-07-29 23:47:18 UTC",
    "google_flights_url": (
        "https://www.google.com/travel/flights?hl=en&gl=us&curr=USD&tfs="
        "CBwQAhoeEgoyMDI2LTA3LTMwagcIARIDQ0RHcgcIARIDQVVTQAFIAXABmAEC&tfu=EgIIAQ"
    ),
    "raw_html_file": "https://serpapi.com/searches/6OyZ-5lsBH_tfV7_ron71Q/6a6a91068270313771b49302.html",
    "prettify_html_file": "https://serpapi.com/searches/6OyZ-5lsBH_tfV7_ron71Q/6a6a91068270313771b49302.prettify",
    "total_time_taken": 4.65,
}

_STUB_RESPONSE = {
    "search_metadata": _STUB_SEARCH_METADATA,
    "search_parameters": {
        "engine": "google_flights",
        "hl": "en",
        "gl": "us",
        "type": "2",
        "departure_id": "CDG",
        "arrival_id": "AUS",
        "outbound_date": "2026-07-30",
        "currency": "USD",
    },
    "best_flights": [
        {
            "flights": [
                {
                    "departure_airport": {
                        "name": "Aéroport de Paris-Charles de Gaulle",
                        "id": "CDG",
                        "time": "2026-07-30 11:00",
                    },
                    "arrival_airport": {
                        "name": "Charlotte Douglas International Airport",
                        "id": "CLT",
                        "time": "2026-07-30 14:20",
                    },
                    "duration": 560,
                    "airplane": "Boeing 777",
                    "airline": "American",
                    "airline_logo": "https://www.gstatic.com/flights/airline_logos/70px/AA.png",
                    "travel_class": "Economy",
                    "flight_number": "AA 787",
                    "legroom": "31 in",
                    "extensions": [
                        "Average legroom (31 in)",
                        "Wi-Fi for a fee",
                        "In-seat power & USB outlets",
                        "On-demand video",
                        "Carbon emissions estimate: 414 kg",
                    ],
                },
                {
                    "departure_airport": {
                        "name": "Charlotte Douglas International Airport",
                        "id": "CLT",
                        "time": "2026-07-30 19:01",
                    },
                    "arrival_airport": {
                        "name": "Austin-Bergstrom International Airport",
                        "id": "AUS",
                        "time": "2026-07-30 20:57",
                    },
                    "duration": 176,
                    "airplane": "Airbus A321",
                    "airline": "American",
                    "airline_logo": "https://www.gstatic.com/flights/airline_logos/70px/AA.png",
                    "travel_class": "Economy",
                    "flight_number": "AA 1905",
                    "legroom": "30 in",
                    "extensions": [
                        "Average legroom (30 in)",
                        "Free Wi-Fi",
                        "In-seat power & USB outlets",
                        "Stream media to your device",
                        "Carbon emissions estimate: 170 kg",
                    ],
                    "often_delayed_by_over_30_min": True,
                },
            ],
            "layovers": [{"duration": 281, "name": "Charlotte Douglas International Airport", "id": "CLT"}],
            "total_duration": 1017,
            "carbon_emissions": {"this_flight": 585000, "typical_for_this_route": 548000, "difference_percent": 7},
            "price": 1650,
            "type": "One way",
            "airline_logo": "https://www.gstatic.com/flights/airline_logos/70px/AA.png",
            "extensions": [
                "Checked baggage for a fee",
                "Fare non-refundable, taxes may be refundable",
                "Ticket changes for a fee",
            ],
            "booking_token": (
                "WyJDalJJV21jdE9WQXlNR1Z6TjNkQlFXVlNhWGRDUnkwdExTMHRMUzB0TFhCbVltUnVPRUZCUVVGQlIzQnhhMUZ2Um5"
                "OdlNIVkJFZ3hCUVRjNE4zeEJRVEU1TURVYUN3aTNpQW9RQWhvRFZWTkVPQnh3dDRnSyIsW1siQ0RHIiwiMjAyNi0wNy0z"
                "MCIsIkNMVCIsbnVsbCwiQUEiLCI3ODciXSxbIkNMVCIsIjIwMjYtMDctMzAiLCJBVVMiLG51bGwsIkFBIiwiMTkwNSJd"
                "XV0="
            ),
        },
        {
            "flights": [
                {
                    "departure_airport": {
                        "name": "Aéroport de Paris-Charles de Gaulle",
                        "id": "CDG",
                        "time": "2026-07-30 14:15",
                    },
                    "arrival_airport": {"name": "Heathrow Airport", "id": "LHR", "time": "2026-07-30 14:40"},
                    "duration": 85,
                    "airplane": "Airbus A319",
                    "airline": "British Airways",
                    "airline_logo": "https://www.gstatic.com/flights/airline_logos/70px/BA.png",
                    "travel_class": "Economy",
                    "flight_number": "BA 305",
                    "ticket_also_sold_by": ["American"],
                    "legroom": "29 in",
                    "extensions": [
                        "Below average legroom (29 in)",
                        "In-seat USB outlet",
                        "Carbon emissions estimate: 59 kg",
                    ],
                },
                {
                    "departure_airport": {"name": "Heathrow Airport", "id": "LHR", "time": "2026-07-30 16:05"},
                    "arrival_airport": {
                        "name": "Austin-Bergstrom International Airport",
                        "id": "AUS",
                        "time": "2026-07-30 20:35",
                    },
                    "duration": 630,
                    "airplane": "Boeing 787",
                    "airline": "British Airways",
                    "airline_logo": "https://www.gstatic.com/flights/airline_logos/70px/BA.png",
                    "travel_class": "Economy",
                    "flight_number": "BA 187",
                    "ticket_also_sold_by": ["American"],
                    "legroom": "31 in",
                    "extensions": [
                        "Average legroom (31 in)",
                        "In-seat power & USB outlets",
                        "On-demand video",
                        "Carbon emissions estimate: 426 kg",
                    ],
                },
            ],
            "layovers": [{"duration": 85, "name": "Heathrow Airport", "id": "LHR"}],
            "total_duration": 800,
            "carbon_emissions": {"this_flight": 486000, "typical_for_this_route": 548000, "difference_percent": -11},
            "price": 2200,
            "type": "One way",
            "airline_logo": "https://www.gstatic.com/flights/airline_logos/70px/BA.png",
            "extensions": [
                "Checked baggage for a fee",
                "Fare non-refundable, taxes may be refundable",
                "Ticket changes for a fee",
            ],
            "booking_token": (
                "WyJDalJJV21jdE9WQXlNR1Z6TjNkQlFXVlNhWGRDUnkwdExTMHRMUzB0TFhCbVltUnVPRUZCUVVGQlIzQnhhMUZ2Um5"
                "OdlNIVkJFZ3RDUVRNd05YeENRVEU0TnhvTENJTzJEUkFDR2dOVlUwUTRISENEdGcwPSIsW1siQ0RHIiwiMjAyNi0wNy0z"
                "MCIsIkxIUiIsbnVsbCwiQkEiLCIzMDUiXSxbIkxIUiIsIjIwMjYtMDctMzAiLCJBVVMiLG51bGwsIkJBIiwiMTg3Il1d"
                "XQ=="
            ),
        },
        {
            "flights": [
                {
                    "departure_airport": {
                        "name": "Aéroport de Paris-Charles de Gaulle",
                        "id": "CDG",
                        "time": "2026-07-30 09:40",
                    },
                    "arrival_airport": {"name": "Amsterdam Airport Schiphol", "id": "AMS", "time": "2026-07-30 10:55"},
                    "duration": 75,
                    "airplane": "Boeing 737",
                    "airline": "KLM",
                    "airline_logo": "https://www.gstatic.com/flights/airline_logos/70px/KL.png",
                    "travel_class": "Economy",
                    "flight_number": "KL 1404",
                    "legroom": "30 in",
                    "extensions": ["Average legroom (30 in)", "In-seat USB outlet", "Carbon emissions estimate: 50 kg"],
                },
                {
                    "departure_airport": {
                        "name": "Amsterdam Airport Schiphol",
                        "id": "AMS",
                        "time": "2026-07-30 12:40",
                    },
                    "arrival_airport": {
                        "name": "Austin-Bergstrom International Airport",
                        "id": "AUS",
                        "time": "2026-07-30 16:10",
                    },
                    "duration": 630,
                    "airplane": "Boeing 777",
                    "airline": "KLM",
                    "airline_logo": "https://www.gstatic.com/flights/airline_logos/70px/KL.png",
                    "travel_class": "Economy",
                    "flight_number": "KL 667",
                    "legroom": "31 in",
                    "extensions": [
                        "Average legroom (31 in)",
                        "Wi-Fi for a fee",
                        "In-seat USB outlet",
                        "On-demand video",
                        "Carbon emissions estimate: 488 kg",
                    ],
                },
            ],
            "layovers": [{"duration": 105, "name": "Amsterdam Airport Schiphol", "id": "AMS"}],
            "total_duration": 810,
            "carbon_emissions": {"this_flight": 540000, "typical_for_this_route": 548000, "difference_percent": -1},
            "price": 2227,
            "type": "One way",
            "airline_logo": "https://www.gstatic.com/flights/airline_logos/70px/KL.png",
            "extensions": [
                "Checked baggage for a fee",
                "Fare non-refundable, taxes may be refundable",
                "Ticket changes for a fee",
            ],
            "booking_token": (
                "WyJDalJJV21jdE9WQXlNR1Z6TjNkQlFXVlNhWGRDUnkwdExTMHRMUzB0TFhCbVltUnVPRUZCUVVGQlIzQnhhMUZ2Um5"
                "OdlNIVkJFZ3hMVERFME1EUjhTMHcyTmpjYUN3akJ5dzBRQWhvRFZWTkVPQnh3d2NzTiIsW1siQ0RHIiwiMjAyNi0wNy0z"
                "MCIsIkFNUyIsbnVsbCwiS0wiLCIxNDA0Il0sWyJBTVMiLCIyMDI2LTA3LTMwIiwiQVVTIixudWxsLCJLTCIsIjY2NyJd"
                "XV0="
            ),
        },
        {
            "flights": [
                {
                    "departure_airport": {
                        "name": "Aéroport de Paris-Charles de Gaulle",
                        "id": "CDG",
                        "time": "2026-07-30 09:25",
                    },
                    "arrival_airport": {
                        "name": "Hartsfield-Jackson Atlanta International Airport",
                        "id": "ATL",
                        "time": "2026-07-30 12:47",
                    },
                    "duration": 562,
                    "airplane": "Airbus A350",
                    "airline": "Delta",
                    "airline_logo": "https://www.gstatic.com/flights/airline_logos/70px/DL.png",
                    "travel_class": "Economy",
                    "flight_number": "DL 83",
                    "ticket_also_sold_by": ["Air France", "KLM"],
                    "legroom": "31 in",
                    "extensions": [
                        "Average legroom (31 in)",
                        "Wi-Fi for a fee",
                        "In-seat power & USB outlets",
                        "On-demand video",
                        "Carbon emissions estimate: 409 kg",
                    ],
                    "often_delayed_by_over_30_min": True,
                },
                {
                    "departure_airport": {
                        "name": "Hartsfield-Jackson Atlanta International Airport",
                        "id": "ATL",
                        "time": "2026-07-30 14:15",
                    },
                    "arrival_airport": {
                        "name": "Austin-Bergstrom International Airport",
                        "id": "AUS",
                        "time": "2026-07-30 15:50",
                    },
                    "duration": 155,
                    "airplane": "Airbus A321",
                    "airline": "Delta",
                    "airline_logo": "https://www.gstatic.com/flights/airline_logos/70px/DL.png",
                    "travel_class": "Economy",
                    "flight_number": "DL 1397",
                    "ticket_also_sold_by": ["Air France", "KLM"],
                    "legroom": "31 in",
                    "extensions": [
                        "Average legroom (31 in)",
                        "Free Wi-Fi",
                        "In-seat power & USB outlets",
                        "Live TV",
                        "Carbon emissions estimate: 136 kg",
                    ],
                    "often_delayed_by_over_30_min": True,
                },
            ],
            "layovers": [
                {"duration": 88, "name": "Hartsfield-Jackson Atlanta International Airport", "id": "ATL"}
            ],
            "total_duration": 805,
            "carbon_emissions": {"this_flight": 546000, "typical_for_this_route": 548000, "difference_percent": 0},
            "price": 2242,
            "type": "One way",
            "airline_logo": "https://www.gstatic.com/flights/airline_logos/70px/DL.png",
            "extensions": [
                "Checked baggage for a fee",
                "Fare non-refundable, taxes may be refundable",
                "Ticket changes for a fee",
            ],
            "booking_token": (
                "WyJDalJJV21jdE9WQXlNR1Z6TjNkQlFXVlNhWGRDUnkwdExTMHRMUzB0TFhCbVltUnVPRUZCUVVGQlIzQnhhMUZ2Um5"
                "OdlNIVkJFZ3RFVERnemZFUk1NVE01TnhvTENQYldEUkFDR2dOVlUwUTRISEQyMWcwPSIsW1siQ0RHIiwiMjAyNi0wNy0z"
                "MCIsIkFUTCIsbnVsbCwiREwiLCI4MyJdLFsiQVRMIiwiMjAyNi0wNy0zMCIsIkFVUyIsbnVsbCwiREwiLCIxMzk3Il1d"
                "XQ=="
            ),
        },
    ],
    "other_flights": [],
    "price_insights": {
        "lowest_price": 1650,
        "price_level": "high",
        "typical_price_range": [760, 1400],
        "price_history": [[1785189600, 1557], [1785276000, 1559], [1785362400, 1650]],
    },
    "airports": [
        {
            "departure": [
                {
                    "airport": {"id": "CDG", "name": "Aéroport de Paris-Charles de Gaulle"},
                    "city": "Paris",
                    "country": "France",
                    "country_code": "FR",
                }
            ],
            "arrival": [
                {
                    "airport": {"id": "AUS", "name": "Austin-Bergstrom International Airport"},
                    "city": "Austin",
                    "country": "United States",
                    "country_code": "US",
                }
            ],
        }
    ],
}


def stub_response(params: dict) -> dict:
    """Dev-only fixture, mirroring frontend/src/mocks/data/flights.ts: only
    From: CDG  To: AUS  Depart: 2026-07-30  Return: (blank)  Travelers: 1 returns the
    populated fixture. Any other search raises SerpApiNotConfiguredError rather than an
    empty response, so it's not mistaken for a genuine zero-result search."""
    matches = (
        str(params.get("from", "")).strip().upper() == "CDG"
        and str(params.get("to", "")).strip().upper() == "AUS"
        and params.get("depart") == "2026-07-30"
        and not str(params.get("return", "")).strip()
        and params.get("travelers") == 1
    )
    if not matches:
        raise SerpApiNotConfiguredError(
            "SERPAPI_KEY is not configured, so flight search can't return real results. "
            "Set SERPAPI_KEY in backend/.env, or try the no-key demo search: "
            "From: CDG  To: AUS  Depart: 2026-07-30 (one-way, 1 traveler)."
        )
    return _STUB_RESPONSE


# Mirrors frontend/src/mocks/data/hotels.ts's googleHotelsSearchResponse, trimmed to
# the fields the app actually reads.
_STUB_HOTEL_SEARCH_METADATA = {
    "id": "6a9333b1759dbc5ff4b26097",
    "status": "Success",
    "json_endpoint": "https://serpapi.com/searches/FYzEcWCNTDMd441WgHp0x11Lo4Mj7owSAPGiU_t8cSk/6a9333b1759dbc5ff4b26097.json",
    "created_at": "2026-08-29 19:32:01 UTC",
    "processed_at": "2026-08-29 19:32:01 UTC",
    "google_hotels_url": "https://www.google.com/travel/search?q=Bali+Resorts&hl=en&gl=us",
    "total_time_taken": 2.6,
}

_STUB_HOTEL_RESPONSE = {
    "search_metadata": _STUB_HOTEL_SEARCH_METADATA,
    "search_parameters": {
        "engine": "google_hotels",
        "q": "Bali Resorts",
        "gl": "us",
        "hl": "en",
        "currency": "USD",
        "check_in_date": "2026-08-29",
        "check_out_date": "2026-08-30",
        "adults": 2,
        "children": 0,
    },
    "properties": [
        {
            "type": "vacation rental",
            "name": "The Pandawa Hills Ceningan",
            "property_token": "ChoQxJaakviXiNqEARoNL2cvMTFrajVwaGRrdxAC",
            "gps_coordinates": {"latitude": -8.701930046081543, "longitude": 115.44574737548828},
            "check_in_time": "2:00 PM",
            "check_out_time": "12:00 PM",
            "rate_per_night": {"lowest": "$17", "extracted_lowest": 17},
            "total_rate": {"lowest": "$17", "extracted_lowest": 17},
            "overall_rating": 4.7,
            "reviews": 37,
            "amenities": [
                "Air conditioning",
                "Hot tub",
                "Indoor pool",
                "Kitchen",
                "Smoke-free",
                "Cable TV",
                "Washer",
                "Wheelchair accessible",
                "Free parking",
                "Free Wi-Fi",
            ],
            "images": [
                {
                    "thumbnail": (
                        "https://lh6.googleusercontent.com/proxy/KE0j_Nzwf2mwpkyoaW6u0p9dbHdZW9auJZ5ib5rRGxQr4rkpb"
                        "NyvXkUNT_L-3svo6AFT5-whOoBZG11JesTJZDxoX6nlXVvITqDTs4T56Ij8xh9b5z4alwocLnFfhCAVYEzIdiC40Pcy"
                        "BKNMWejoRbhfFOTVj4o=s287-w287-h192-n-k-no-v1"
                    ),
                    "original_image": "https://static.cupid.travel/hotels/196088169.jpg",
                }
            ],
        },
        {
            "type": "hotel",
            "name": "Sol by Melia Benoa Bali - All Inclusive",
            "description": "Chic hotel opposite a private area of beach, plus dining, bars, a spa & an outdoor pool.",
            "link": (
                "https://www.melia.com/en/hotels/indonesia/bali/sol-benoa-bali?utm_campaign=google&utm_content="
                "5709&utm_medium=organic&utm_source=directories"
            ),
            "property_token": "ChcI4e7r_e32oJUmGgsvZy8xdnA1XzlzZxAB",
            "gps_coordinates": {"latitude": -8.786757, "longitude": 115.22642900000001},
            "check_in_time": "3:00 PM",
            "check_out_time": "12:00 PM",
            "rate_per_night": {"lowest": "$130", "extracted_lowest": 130},
            "total_rate": {"lowest": "$130", "extracted_lowest": 130},
            "hotel_class": "5-star hotel",
            "extracted_hotel_class": 5,
            "overall_rating": 4.5,
            "reviews": 1917,
            "amenities": [
                "Breakfast ($)",
                "Free Wi-Fi",
                "Free parking",
                "Outdoor pool",
                "Air conditioning",
                "Fitness center",
                "Spa",
                "Beach access",
                "Bar",
                "Restaurant",
                "Room service",
                "Airport shuttle",
                "Full-service laundry",
                "Accessible",
                "Business center",
                "Kid-friendly",
                "Smoke-free property",
            ],
            "images": [
                {
                    "thumbnail": (
                        "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWnRzYJqWSC9nhxJpVUjW0urJz3cv36kyNpj24Br3uf"
                        "CYOKcw4etPmmZmjqTU4hwuLMYhpIA5w0arzMJt7k6xnd3YWaWL8FM5f0XQowkXMJWITWTvjOws-CzOWUfoHDQXAyz7T"
                        "NM=s287-w287-h192-n-k-no-v1"
                    ),
                    "original_image": (
                        "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWnRzYJqWSC9nhxJpVUjW0urJz3cv36kyNpj24Br3uf"
                        "CYOKcw4etPmmZmjqTU4hwuLMYhpIA5w0arzMJt7k6xnd3YWaWL8FM5f0XQowkXMJWITWTvjOws-CzOWUfoHDQXAyz7T"
                        "NM=s10000"
                    ),
                }
            ],
            "deal": "34% less than usual",
            "deal_description": "Great Deal",
        },
        {
            "type": "hotel",
            "name": "Bvlgari Resort Bali",
            "description": (
                "Luxury cliff-top resort with villas & mansions, plus a private beach, sophisticated dining & a spa."
            ),
            "link": "https://www.bulgarihotels.com/en_US/bali?scid=f2ae0541-1279-4f24-b197-a979c79310b0",
            "property_token": "ChgIl8WV3uPShsnhARoLL2cvMXdyYjV3bXoQAQ",
            "gps_coordinates": {"latitude": -8.8429187, "longitude": 115.12169089999999},
            "check_in_time": "3:00 PM",
            "check_out_time": "12:00 PM",
            "rate_per_night": {"lowest": "$2,917", "extracted_lowest": 2917},
            "total_rate": {"lowest": "$2,917", "extracted_lowest": 2917},
            "hotel_class": "5-star hotel",
            "extracted_hotel_class": 5,
            "overall_rating": 4.7,
            "reviews": 1964,
            "amenities": [
                "Free breakfast",
                "Free Wi-Fi",
                "Free parking",
                "Outdoor pool",
                "Air conditioning",
                "Fitness center",
                "Spa",
                "Beach access",
                "Bar",
                "Restaurant",
                "Room service",
                "Airport shuttle",
                "Full-service laundry",
                "Kid-friendly",
            ],
            "images": [
                {
                    "thumbnail": (
                        "https://lh3.googleusercontent.com/proxy/Fb0hwJoVxCr2I9HGezl45KoP4vAQ3oA6vdBvo8qc3oQ7_ynKr"
                        "LKjIA09PA_RuO5gVbUPHRZ3ZSvL_1_RDZN00fKjsG_ExCYkh92a9_HnKAS4A_EDY7n1jyJgzKzHINRSoHP2rUvxu7gO"
                        "_bbZ7q2v7sVK4C0zDsI=s287-w287-h192-n-k-no-v1"
                    ),
                    "original_image": "https://photos.hotelbeds.com/giata/original/09/096365/096365a_hb_a_004.jpg",
                }
            ],
        },
    ],
}


def stub_hotels_response(params: dict) -> dict:
    """Dev-only fixture, mirroring frontend/src/mocks/data/hotels.ts: only
    Location: Bali Resorts  Check-in: 2026-08-29  Check-out: 2026-08-30  Guests: 2
    returns the populated fixture. See stub_response's docstring for why any other
    search raises SerpApiNotConfiguredError instead of an empty response."""
    matches = (
        str(params.get("location", "")).strip().lower() == "bali resorts"
        and params.get("checkIn") == "2026-08-29"
        and params.get("checkOut") == "2026-08-30"
        and params.get("guests") == 2
    )
    if not matches:
        raise SerpApiNotConfiguredError(
            "SERPAPI_KEY is not configured, so hotel search can't return real results. "
            "Set SERPAPI_KEY in backend/.env, or try the no-key demo search: "
            "Location: Bali Resorts  Check-in: 2026-08-29  Check-out: 2026-08-30  Guests: 2."
        )
    return _STUB_HOTEL_RESPONSE


# google_events was deprecated by SerpApi in favor of events_results on engine=google
# (see serpapi.py's search_events). This is just that events_results array, mirroring
# frontend/src/mocks/data/events.ts's googleEventsSearchResponse trimmed the same way
# the real adapter trims it.
_STUB_EVENTS_RESULTS = [
    {
        "title": "More Than Networking: Austin Business Mastermind",
        "type": "Business networking",
        "date": "Oct 1",
        "time": "3:00 PM",
        "address": ["Mama Betty's Tex-Mex - Burnet Rd", "Austin, TX"],
        "thumbnail": "https://serpapi.com/searches/6a9654ccb4ab72a0d5e197ff/images/g_pAxin31O8fxTmrfjIMKWysrDMfoq7CtGPGsOaf8vA.jpeg",
    },
    {
        "title": "The Online Sales & Marketing Summit",
        "type": "Sales and marketing conference",
        "date": "Oct 1",
        "address": ["AT&T Hotel and Conference Center", "West University"],
        "thumbnail": "https://serpapi.com/searches/6a9654ccb4ab72a0d5e197ff/images/xmsTUiuBrvHMvyYJ8ttLnr9BCsEb9Lr9tX-jLymZbhg.jpeg",
    },
    {
        "title": "Venture PFest 2026: Ideas to Impact + Pitch Competition",
        "type": "Business innovation and pitch competition",
        "date": "Oct 1",
        "time": "9:00 AM",
        "address": [
            "Courtyard by Marriott Austin Pflugerville and Pflugerville Conference Center",
            "Pflugerville, TX",
        ],
        "thumbnail": "https://serpapi.com/searches/6a9654ccb4ab72a0d5e197ff/images/yGDUZdcHiFdazyo2G3QPz-OcxZ0_9Vt17UUDuOtiD9I.jpeg",
    },
    {
        "title": "SideHustle® LIVE Comedy Game Show for Entrepreneurs",
        "type": "Comedy game show",
        "date": "Oct 1",
        "time": "6:00 PM",
        "address": ["Pershing Hall", "East Austin"],
        "thumbnail": "https://serpapi.com/searches/6a9654ccb4ab72a0d5e197ff/images/rwnqTDpbDhccLhgdXhcXDo6W8dF1jpSE7eSGvSTYPAA.jpeg",
    },
    {
        "title": "ACGtalks: Jorge Caballero & Matthew Lyons",
        "type": "Classical guitar performance",
        "date": "Oct 1",
        "time": "5:30 PM",
        "address": ["Austin Classical Guitar", "Hyde Park"],
        "thumbnail": "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcRKs6pQha4R_wnrp4w1IbXMiOO2Gd0syJV_KF6PTA2hT8dswR0Tpl02c6T7uTdDwz8JD82fQxm_CWIHuKk",
    },
    {
        "title": "SKETCHY THURSDAYS",
        "type": "Weekly art gathering",
        "date": "Oct 1",
        "time": "7:00 PM",
        "address": ["Something Cool Studios", "East Austin"],
        "thumbnail": "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcSCmnsuInOlhUioGogzV36S4LDymdfinRi81JYRQBq40mUR5jBwhq3gxgdQ1RTaH16TqfAEof-wflCEjq8",
    },
    {
        "title": "Austin Steel Guitar Fest",
        "type": "Steel guitar music festival",
        "date": "Oct 1",
        "time": "9:00 AM",
        "address": ["Austin Marriott South", "Austin, TX"],
        "thumbnail": "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcTDF6ffpa_7GcCSM92jSglTgxXYKNGkLoji3EownQZvx57iQ41VovtRkwlurTCMiMzY1mkDjr8q2J1M6aE",
    },
    {
        "title": "Karaoke Night",
        "type": "Karaoke social gathering",
        "date": "Oct 1",
        "time": "6:00 PM",
        "address": ["The Lion's Den Tea", "Austin, TX"],
        "thumbnail": "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcR_Vbxim6nJsmxkJr39ooY2bRE8NkPoS-xb7TUgnZga-Qdw_G4SZIWW0V54ClKN-JO116cOknUHVRKGznw",
    },
    {
        "title": "Open Mic Night- Come Join Us!",
        "type": "Live music open mic",
        "date": "Oct 1",
        "time": "6:00 PM",
        "address": ["Hops & Thyme", "Austin, TX"],
        "thumbnail": "https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcQJwQy6gL50S10ufOjyjx4BfCd2lxOO6KbkPOznDMHh-hJvyWNWZ6z9NfYD2ab1yLuXvDipwzT4RGABWFQ",
    },
    {
        "title": "Books and Brews- October Read: Born a Crime by Trevor Noah",
        "type": "Book discussion",
        "date": "Oct 1",
        "time": "5:30 PM",
        "address": ["Austin Beerworks", "Austin, TX"],
        "thumbnail": "https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcTAR-HW02s2CvtAaDC7CCoy3U-tKFd4RaKUEezrJ8YvWjPUiNqv9vPkQLFyOiiwaP9SlvbQWw3NCjcNtlA",
    },
]

_STUB_EVENTS_RESPONSE = {"events_results": _STUB_EVENTS_RESULTS}


def stub_events_response(params: dict) -> dict:
    """Dev-only fixture, mirroring frontend/src/mocks/data/events.ts: only
    Location: Austin, Texas with an event name that is blank or "Networking" returns the
    populated fixture (dates don't affect matching). See stub_response's docstring for
    why any other search raises SerpApiNotConfiguredError instead of an empty response."""
    matches = (
        str(params.get("eventName") or "").strip().lower() in ("", "networking")
        and str(params.get("location", "")).strip().lower() == "austin, texas"
    )
    if not matches:
        raise SerpApiNotConfiguredError(
            "SERPAPI_KEY is not configured, so event search can't return real results. "
            "Set SERPAPI_KEY in backend/.env, or try the no-key demo search: "
            "Location: Austin, Texas (Event name and dates optional)."
        )
    return _STUB_EVENTS_RESPONSE


# Mirrors frontend/src/mocks/data/flightsBookingToken.ts.
_STUB_BOOKING_TOKEN = (
    "WyJDalJJYkZaeVdYaFBUMFpQU21OQlMwcFRhMEZDUnkwdExTMHRMUzB0TFMxMmRIcDJOVUZCUVVGQlIzRmtN"
    "Rlk0VEROR1dFTkJFZ1pYVGpFeU5ETWFDd2pjcGdFUUFob0RWVk5FT0J4dzNLWUIiLFtbIkRBTCIsIjIwMjYtMDktMDYi"
    "LCJBVVMiLG51bGwsIldOIiwiMTI0MyJdXV0="
)
_STUB_BOOKING_LINK_URL = "https://www.google.com/travel/clk/f"
_STUB_ROUND_TRIP_BOOKING_LINK_URL = "https://www.google.com/travel/clk/r"


def stub_booking_link_response(params: dict) -> str | None:
    """Dev-only fixture, mirroring frontend/src/mocks/data/flightsBookingToken.ts: only
    DAL -> AUS, 2026-09-06, one-way, with that exact booking_token (Southwest WN 1243)
    returns a URL; the round trip's "stub-round-trip-booking-token" (see
    stub_return_flights_response) with the matching DAL -> DEN dates returns a second URL;
    anything else returns None, the same as SerpApi returning no booking_options for a
    token it doesn't recognize. Set SERPAPI_KEY in backend/app/.env to hit the real API
    instead."""
    one_way_matches = (
        str(params.get("departure_id", "")).strip().upper() == "DAL"
        and str(params.get("arrival_id", "")).strip().upper() == "AUS"
        and params.get("outbound_date") == "2026-09-06"
        and params.get("type", "2") == "2"
        and params.get("booking_token") == _STUB_BOOKING_TOKEN
    )
    if one_way_matches:
        return _STUB_BOOKING_LINK_URL

    round_trip_matches = (
        str(params.get("departure_id", "")).strip().upper() == "DAL"
        and str(params.get("arrival_id", "")).strip().upper() == "DEN"
        and params.get("outbound_date") == "2026-11-01"
        and params.get("return_date") == "2026-11-07"
        and params.get("booking_token") == "stub-round-trip-booking-token"
    )
    return _STUB_ROUND_TRIP_BOOKING_LINK_URL if round_trip_matches else None


# Captured from a real DAL -> DEN round-trip search; fabricates a plausible return
# leg for dev/testing without SERPAPI_KEY.
_STUB_RETURN_DEPARTURE_TOKEN = (
    "WyJDalJJUXpGS1owdFZNV2RtUmxGQlZYZFRWM2RDUnkwdExTMHRMUzB0TFhsc2FuTXhPVUZCUVVGQlIzRmxOWHBSVDBONU5"
    "ESkJFZ1pYVGpFek5qTWFDd2prNndFUUFob0RWVk5FT0J4dzVPc0IiLFtbIkRBTCIsIjIwMjYtMTEtMDEiLCJERU4iLG51bGwsIldOIiwiMTM2MyJdXV0="
)

_STUB_RETURN_FLIGHTS_RESPONSE = {
    "search_metadata": _STUB_SEARCH_METADATA,
    "search_parameters": {
        "engine": "google_flights",
        "hl": "en",
        "gl": "us",
        "type": "1",
        "departure_id": "DAL",
        "arrival_id": "DEN",
        "outbound_date": "2026-11-01",
        "return_date": "2026-11-07",
        "currency": "USD",
    },
    "best_flights": [
        {
            "flights": [
                {
                    "departure_airport": {
                        "name": "Denver International Airport",
                        "id": "DEN",
                        "time": "2026-11-07 18:10",
                    },
                    "arrival_airport": {
                        "name": "Dallas Love Field",
                        "id": "DAL",
                        "time": "2026-11-07 21:25",
                    },
                    "duration": 135,
                    "airplane": "Boeing 737-700 (Scimitar Winglets) Pax",
                    "airline": "Southwest",
                    "airline_logo": "https://www.gstatic.com/flights/airline_logos/70px/WN.png",
                    "travel_class": "Economy",
                    "flight_number": "WN 2481",
                    "legroom": "31 in",
                    "extensions": ["Average legroom (31 in)", "Free Wi-Fi"],
                }
            ],
            "total_duration": 135,
            "price": 302,
            "type": "Round trip",
            "airline_logo": "https://www.gstatic.com/flights/airline_logos/70px/WN.png",
            "booking_token": "stub-round-trip-booking-token",
        }
    ],
    "other_flights": [],
}


def stub_return_flights_response(params: dict) -> dict:
    """Dev-only fixture for round trip's second (return-leg) SerpApi call: only the real
    departure_token captured from trip #3's DAL -> DEN search returns the populated
    fixture; any other token gets the same-shaped empty response. Set SERPAPI_KEY in
    backend/app/.env to hit the real API instead."""
    if params.get("departure_token") == _STUB_RETURN_DEPARTURE_TOKEN:
        return _STUB_RETURN_FLIGHTS_RESPONSE
    return {
        "search_metadata": _STUB_SEARCH_METADATA,
        "search_parameters": {
            "engine": "google_flights",
            "hl": "en",
            "gl": "us",
            "type": "1",
            "departure_id": str(params.get("departure_id", "")).strip().upper(),
            "arrival_id": str(params.get("arrival_id", "")).strip().upper(),
            "outbound_date": params.get("outbound_date"),
            "return_date": params.get("return_date"),
            "currency": "USD",
        },
        "best_flights": [],
        "other_flights": [],
    }


# Mirrors frontend/src/mocks/data/hotelsPropertyDetails.ts.
_STUB_HOTEL_PROPERTY_TOKEN = "ChcI9uq9hrWO2OtjGgsvZy8xMjJ0YzFteBAB"
_STUB_HOTEL_BOOKING_LINK_URL = "https://www.hilton.com/en/hotels/dpsbahi-hilton-bali-resort/?SEO_id=GMB-APAC-HI-DPSBAHI"
_STUB_HOTEL_ADDRESS = "Jl. Raya Nusa Dua Selatan, Benoa, Kec. Kuta Sel., Kabupaten Badung, Bali 80361, Indonesia"


def stub_hotel_booking_link_response(params: dict) -> dict:
    """Dev-only fixture, mirroring frontend/src/mocks/data/hotelsPropertyDetails.ts: only
    that exact property_token (Hilton Bali Resort), check-in 2026-09-06, check-out
    2026-09-07, 2 adults returns the url + address; anything else returns both as None,
    the same as SerpApi returning no property details for a token it doesn't recognize.
    Set SERPAPI_KEY in backend/app/.env to hit the real API instead."""
    matches = (
        params.get("property_token") == _STUB_HOTEL_PROPERTY_TOKEN
        and params.get("check_in_date") == "2026-09-06"
        and params.get("check_out_date") == "2026-09-07"
        and params.get("adults", 1) == 2
    )
    if not matches:
        return {"url": None, "address": None}
    return {"url": _STUB_HOTEL_BOOKING_LINK_URL, "address": _STUB_HOTEL_ADDRESS}
