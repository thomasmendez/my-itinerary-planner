import type { GoogleFlightsSearchResponse } from '../../api/flights'

// Fixture for GET https://serpapi.com/search.json?engine=google_flights&departure_id=CDG&arrival_id=AUS&currency=USD&type=2&outbound_date=2026-07-30
export const googleFlightsSearchResponse: GoogleFlightsSearchResponse = {
  search_metadata: {
    id: '6a6a91068270313771b49302',
    status: 'Success',
    json_endpoint: 'https://serpapi.com/searches/6OyZ-5lsBH_tfV7_ron71Q/6a6a91068270313771b49302.json',
    created_at: '2026-07-29 23:47:18 UTC',
    processed_at: '2026-07-29 23:47:18 UTC',
    google_flights_url:
      'https://www.google.com/travel/flights?hl=en&gl=us&curr=USD&tfs=CBwQAhoeEgoyMDI2LTA3LTMwagcIARIDQ0RHcgcIARIDQVVTQAFIAXABmAEC&tfu=EgIIAQ',
    raw_html_file: 'https://serpapi.com/searches/6OyZ-5lsBH_tfV7_ron71Q/6a6a91068270313771b49302.html',
    prettify_html_file: 'https://serpapi.com/searches/6OyZ-5lsBH_tfV7_ron71Q/6a6a91068270313771b49302.prettify',
    total_time_taken: 4.65,
  },
  search_parameters: {
    engine: 'google_flights',
    hl: 'en',
    gl: 'us',
    type: '2',
    departure_id: 'CDG',
    arrival_id: 'AUS',
    outbound_date: '2026-07-30',
    currency: 'USD',
  },
  best_flights: [
    {
      flights: [
        {
          departure_airport: { name: 'Aéroport de Paris-Charles de Gaulle', id: 'CDG', time: '2026-07-30 11:00' },
          arrival_airport: { name: 'Charlotte Douglas International Airport', id: 'CLT', time: '2026-07-30 14:20' },
          duration: 560,
          airplane: 'Boeing 777',
          airline: 'American',
          airline_logo: 'https://www.gstatic.com/flights/airline_logos/70px/AA.png',
          travel_class: 'Economy',
          flight_number: 'AA 787',
          legroom: '31 in',
          extensions: [
            'Average legroom (31 in)',
            'Wi-Fi for a fee',
            'In-seat power & USB outlets',
            'On-demand video',
            'Carbon emissions estimate: 414 kg',
          ],
        },
        {
          departure_airport: { name: 'Charlotte Douglas International Airport', id: 'CLT', time: '2026-07-30 19:01' },
          arrival_airport: { name: 'Austin-Bergstrom International Airport', id: 'AUS', time: '2026-07-30 20:57' },
          duration: 176,
          airplane: 'Airbus A321',
          airline: 'American',
          airline_logo: 'https://www.gstatic.com/flights/airline_logos/70px/AA.png',
          travel_class: 'Economy',
          flight_number: 'AA 1905',
          legroom: '30 in',
          extensions: [
            'Average legroom (30 in)',
            'Free Wi-Fi',
            'In-seat power & USB outlets',
            'Stream media to your device',
            'Carbon emissions estimate: 170 kg',
          ],
          often_delayed_by_over_30_min: true,
        },
      ],
      layovers: [{ duration: 281, name: 'Charlotte Douglas International Airport', id: 'CLT' }],
      total_duration: 1017,
      carbon_emissions: { this_flight: 585000, typical_for_this_route: 548000, difference_percent: 7 },
      price: 1650,
      type: 'One way',
      airline_logo: 'https://www.gstatic.com/flights/airline_logos/70px/AA.png',
      extensions: [
        'Checked baggage for a fee',
        'Fare non-refundable, taxes may be refundable',
        'Ticket changes for a fee',
      ],
      booking_token:
        'WyJDalJJV21jdE9WQXlNR1Z6TjNkQlFXVlNhWGRDUnkwdExTMHRMUzB0TFhCbVltUnVPRUZCUVVGQlIzQnhhMUZ2Um5OdlNIVkJFZ3hCUVRjNE4zeEJRVEU1TURVYUN3aTNpQW9RQWhvRFZWTkVPQnh3dDRnSyIsW1siQ0RHIiwiMjAyNi0wNy0zMCIsIkNMVCIsbnVsbCwiQUEiLCI3ODciXSxbIkNMVCIsIjIwMjYtMDctMzAiLCJBVVMiLG51bGwsIkFBIiwiMTkwNSJdXV0=',
    },
    {
      flights: [
        {
          departure_airport: { name: 'Aéroport de Paris-Charles de Gaulle', id: 'CDG', time: '2026-07-30 14:15' },
          arrival_airport: { name: 'Heathrow Airport', id: 'LHR', time: '2026-07-30 14:40' },
          duration: 85,
          airplane: 'Airbus A319',
          airline: 'British Airways',
          airline_logo: 'https://www.gstatic.com/flights/airline_logos/70px/BA.png',
          travel_class: 'Economy',
          flight_number: 'BA 305',
          ticket_also_sold_by: ['American'],
          legroom: '29 in',
          extensions: ['Below average legroom (29 in)', 'In-seat USB outlet', 'Carbon emissions estimate: 59 kg'],
        },
        {
          departure_airport: { name: 'Heathrow Airport', id: 'LHR', time: '2026-07-30 16:05' },
          arrival_airport: { name: 'Austin-Bergstrom International Airport', id: 'AUS', time: '2026-07-30 20:35' },
          duration: 630,
          airplane: 'Boeing 787',
          airline: 'British Airways',
          airline_logo: 'https://www.gstatic.com/flights/airline_logos/70px/BA.png',
          travel_class: 'Economy',
          flight_number: 'BA 187',
          ticket_also_sold_by: ['American'],
          legroom: '31 in',
          extensions: [
            'Average legroom (31 in)',
            'In-seat power & USB outlets',
            'On-demand video',
            'Carbon emissions estimate: 426 kg',
          ],
        },
      ],
      layovers: [{ duration: 85, name: 'Heathrow Airport', id: 'LHR' }],
      total_duration: 800,
      carbon_emissions: { this_flight: 486000, typical_for_this_route: 548000, difference_percent: -11 },
      price: 2200,
      type: 'One way',
      airline_logo: 'https://www.gstatic.com/flights/airline_logos/70px/BA.png',
      extensions: [
        'Checked baggage for a fee',
        'Fare non-refundable, taxes may be refundable',
        'Ticket changes for a fee',
      ],
      booking_token:
        'WyJDalJJV21jdE9WQXlNR1Z6TjNkQlFXVlNhWGRDUnkwdExTMHRMUzB0TFhCbVltUnVPRUZCUVVGQlIzQnhhMUZ2Um5OdlNIVkJFZ3RDUVRNd05YeENRVEU0TnhvTENJTzJEUkFDR2dOVlUwUTRISENEdGcwPSIsW1siQ0RHIiwiMjAyNi0wNy0zMCIsIkxIUiIsbnVsbCwiQkEiLCIzMDUiXSxbIkxIUiIsIjIwMjYtMDctMzAiLCJBVVMiLG51bGwsIkJBIiwiMTg3Il1dXQ==',
    },
    {
      flights: [
        {
          departure_airport: { name: 'Aéroport de Paris-Charles de Gaulle', id: 'CDG', time: '2026-07-30 09:40' },
          arrival_airport: { name: 'Amsterdam Airport Schiphol', id: 'AMS', time: '2026-07-30 10:55' },
          duration: 75,
          airplane: 'Boeing 737',
          airline: 'KLM',
          airline_logo: 'https://www.gstatic.com/flights/airline_logos/70px/KL.png',
          travel_class: 'Economy',
          flight_number: 'KL 1404',
          legroom: '30 in',
          extensions: ['Average legroom (30 in)', 'In-seat USB outlet', 'Carbon emissions estimate: 50 kg'],
        },
        {
          departure_airport: { name: 'Amsterdam Airport Schiphol', id: 'AMS', time: '2026-07-30 12:40' },
          arrival_airport: { name: 'Austin-Bergstrom International Airport', id: 'AUS', time: '2026-07-30 16:10' },
          duration: 630,
          airplane: 'Boeing 777',
          airline: 'KLM',
          airline_logo: 'https://www.gstatic.com/flights/airline_logos/70px/KL.png',
          travel_class: 'Economy',
          flight_number: 'KL 667',
          legroom: '31 in',
          extensions: [
            'Average legroom (31 in)',
            'Wi-Fi for a fee',
            'In-seat USB outlet',
            'On-demand video',
            'Carbon emissions estimate: 488 kg',
          ],
        },
      ],
      layovers: [{ duration: 105, name: 'Amsterdam Airport Schiphol', id: 'AMS' }],
      total_duration: 810,
      carbon_emissions: { this_flight: 540000, typical_for_this_route: 548000, difference_percent: -1 },
      price: 2227,
      type: 'One way',
      airline_logo: 'https://www.gstatic.com/flights/airline_logos/70px/KL.png',
      extensions: [
        'Checked baggage for a fee',
        'Fare non-refundable, taxes may be refundable',
        'Ticket changes for a fee',
      ],
      booking_token:
        'WyJDalJJV21jdE9WQXlNR1Z6TjNkQlFXVlNhWGRDUnkwdExTMHRMUzB0TFhCbVltUnVPRUZCUVVGQlIzQnhhMUZ2Um5OdlNIVkJFZ3hMVERFME1EUjhTMHcyTmpjYUN3akJ5dzBRQWhvRFZWTkVPQnh3d2NzTiIsW1siQ0RHIiwiMjAyNi0wNy0zMCIsIkFNUyIsbnVsbCwiS0wiLCIxNDA0Il0sWyJBTVMiLCIyMDI2LTA3LTMwIiwiQVVTIixudWxsLCJLTCIsIjY2NyJdXV0=',
    },
    {
      flights: [
        {
          departure_airport: { name: 'Aéroport de Paris-Charles de Gaulle', id: 'CDG', time: '2026-07-30 09:25' },
          arrival_airport: {
            name: 'Hartsfield-Jackson Atlanta International Airport',
            id: 'ATL',
            time: '2026-07-30 12:47',
          },
          duration: 562,
          airplane: 'Airbus A350',
          airline: 'Delta',
          airline_logo: 'https://www.gstatic.com/flights/airline_logos/70px/DL.png',
          travel_class: 'Economy',
          flight_number: 'DL 83',
          ticket_also_sold_by: ['Air France', 'KLM'],
          legroom: '31 in',
          extensions: [
            'Average legroom (31 in)',
            'Wi-Fi for a fee',
            'In-seat power & USB outlets',
            'On-demand video',
            'Carbon emissions estimate: 409 kg',
          ],
          often_delayed_by_over_30_min: true,
        },
        {
          departure_airport: {
            name: 'Hartsfield-Jackson Atlanta International Airport',
            id: 'ATL',
            time: '2026-07-30 14:15',
          },
          arrival_airport: { name: 'Austin-Bergstrom International Airport', id: 'AUS', time: '2026-07-30 15:50' },
          duration: 155,
          airplane: 'Airbus A321',
          airline: 'Delta',
          airline_logo: 'https://www.gstatic.com/flights/airline_logos/70px/DL.png',
          travel_class: 'Economy',
          flight_number: 'DL 1397',
          ticket_also_sold_by: ['Air France', 'KLM'],
          legroom: '31 in',
          extensions: [
            'Average legroom (31 in)',
            'Free Wi-Fi',
            'In-seat power & USB outlets',
            'Live TV',
            'Carbon emissions estimate: 136 kg',
          ],
          often_delayed_by_over_30_min: true,
        },
      ],
      layovers: [{ duration: 88, name: 'Hartsfield-Jackson Atlanta International Airport', id: 'ATL' }],
      total_duration: 805,
      carbon_emissions: { this_flight: 546000, typical_for_this_route: 548000, difference_percent: 0 },
      price: 2242,
      type: 'One way',
      airline_logo: 'https://www.gstatic.com/flights/airline_logos/70px/DL.png',
      extensions: [
        'Checked baggage for a fee',
        'Fare non-refundable, taxes may be refundable',
        'Ticket changes for a fee',
      ],
      booking_token:
        'WyJDalJJV21jdE9WQXlNR1Z6TjNkQlFXVlNhWGRDUnkwdExTMHRMUzB0TFhCbVltUnVPRUZCUVVGQlIzQnhhMUZ2Um5OdlNIVkJFZ3RFVERnemZFUk1NVE01TnhvTENQYldEUkFDR2dOVlUwUTRISEQyMWcwPSIsW1siQ0RHIiwiMjAyNi0wNy0zMCIsIkFUTCIsbnVsbCwiREwiLCI4MyJdLFsiQVRMIiwiMjAyNi0wNy0zMCIsIkFVUyIsbnVsbCwiREwiLCIxMzk3Il1dXQ==',
    },
  ],
  other_flights: [],
  price_insights: {
    lowest_price: 1650,
    price_level: 'high',
    typical_price_range: [760, 1400],
    price_history: [
      [1785189600, 1557],
      [1785276000, 1559],
      [1785362400, 1650],
    ],
  },
  airports: [
    {
      departure: [
        {
          airport: { id: 'CDG', name: 'Aéroport de Paris-Charles de Gaulle' },
          city: 'Paris',
          country: 'France',
          country_code: 'FR',
        },
      ],
      arrival: [
        {
          airport: { id: 'AUS', name: 'Austin-Bergstrom International Airport' },
          city: 'Austin',
          country: 'United States',
          country_code: 'US',
        },
      ],
    },
  ],
}

// Fixture for a round-trip search: DAL -> DEN, depart 2026-11-01, return 2026-11-07.
// Real SerpApi round-trip results carry a `departure_token` (needing a second call for
// the return leg) instead of `booking_token`. None of these entries set `booking_token`,
// on purpose, to exercise selectVisibleFlightResults'/FlightResults' fallback identity
// for that case.
export const googleFlightsRoundTripSearchResponse: GoogleFlightsSearchResponse = {
  search_metadata: googleFlightsSearchResponse.search_metadata,
  search_parameters: {
    engine: 'google_flights',
    hl: 'en',
    gl: 'us',
    type: '1',
    departure_id: 'DAL',
    arrival_id: 'DEN',
    outbound_date: '2026-11-01',
    return_date: '2026-11-07',
    currency: 'USD',
  },
  best_flights: [
    {
      flights: [
        {
          departure_airport: { name: 'Dallas Love Field', id: 'DAL', time: '2026-11-01 06:35' },
          arrival_airport: { name: 'Denver International Airport', id: 'DEN', time: '2026-11-01 07:40' },
          duration: 125,
          airplane: 'Boeing 737-700',
          airline: 'Southwest',
          airline_logo: 'https://www.gstatic.com/flights/airline_logos/70px/WN.png',
          travel_class: 'Economy',
          flight_number: 'WN 1363',
          legroom: '31 in',
          extensions: ['Average legroom (31 in)', 'Free Wi-Fi', 'Carbon emissions estimate: 131 kg'],
        },
      ],
      total_duration: 125,
      carbon_emissions: { this_flight: 132000, typical_for_this_route: 117000, difference_percent: 13 },
      price: 199,
      type: 'Round trip',
      airline_logo: 'https://www.gstatic.com/flights/airline_logos/70px/WN.png',
      extensions: ['Checked baggage for a fee'],
    },
    {
      flights: [
        {
          departure_airport: { name: 'Dallas Love Field', id: 'DAL', time: '2026-11-01 10:10' },
          arrival_airport: { name: 'Denver International Airport', id: 'DEN', time: '2026-11-01 11:20' },
          duration: 130,
          airplane: 'Boeing 737-800',
          airline: 'Southwest',
          airline_logo: 'https://www.gstatic.com/flights/airline_logos/70px/WN.png',
          travel_class: 'Economy',
          flight_number: 'WN 2110',
          legroom: '31 in',
          extensions: ['Average legroom (31 in)', 'Free Wi-Fi', 'Carbon emissions estimate: 133 kg'],
        },
      ],
      total_duration: 130,
      carbon_emissions: { this_flight: 133000, typical_for_this_route: 117000, difference_percent: 14 },
      price: 224,
      type: 'Round trip',
      airline_logo: 'https://www.gstatic.com/flights/airline_logos/70px/WN.png',
      extensions: ['Checked baggage for a fee'],
    },
    {
      flights: [
        {
          departure_airport: { name: 'Dallas Love Field', id: 'DAL', time: '2026-11-01 15:45' },
          arrival_airport: { name: 'Denver International Airport', id: 'DEN', time: '2026-11-01 16:55' },
          duration: 130,
          airplane: 'Boeing 737-700',
          airline: 'Southwest',
          airline_logo: 'https://www.gstatic.com/flights/airline_logos/70px/WN.png',
          travel_class: 'Economy',
          flight_number: 'WN 887',
          legroom: '31 in',
          extensions: ['Average legroom (31 in)', 'Free Wi-Fi', 'Carbon emissions estimate: 133 kg'],
        },
      ],
      total_duration: 130,
      carbon_emissions: { this_flight: 133000, typical_for_this_route: 117000, difference_percent: 14 },
      price: 249,
      type: 'Round trip',
      airline_logo: 'https://www.gstatic.com/flights/airline_logos/70px/WN.png',
      extensions: ['Checked baggage for a fee'],
    },
  ],
  other_flights: [],
}

// Fixture for a round-trip search with real tokens: AUS -> DEN, depart 2026-12-01, return
// 2026-12-08. Unlike googleFlightsRoundTripSearchResponse above (deliberately tokenless,
// to exercise the flightIdentity fallback), this outbound result carries a
// `departure_token` — exercising the ReturnFlightPicker flow (fetchReturnFlights ->
// googleReturnFlightsSearchResponse below).
export const googleFlightsRoundTripWithTokensSearchResponse: GoogleFlightsSearchResponse = {
  search_metadata: googleFlightsSearchResponse.search_metadata,
  search_parameters: {
    engine: 'google_flights',
    hl: 'en',
    gl: 'us',
    type: '1',
    departure_id: 'AUS',
    arrival_id: 'DEN',
    outbound_date: '2026-12-01',
    return_date: '2026-12-08',
    currency: 'USD',
  },
  best_flights: [
    {
      flights: [
        {
          departure_airport: { name: 'Austin-Bergstrom International Airport', id: 'AUS', time: '2026-12-01 08:00' },
          arrival_airport: { name: 'Denver International Airport', id: 'DEN', time: '2026-12-01 09:45' },
          duration: 105,
          airplane: 'Boeing 737-800',
          airline: 'Southwest',
          airline_logo: 'https://www.gstatic.com/flights/airline_logos/70px/WN.png',
          travel_class: 'Economy',
          flight_number: 'WN 512',
          legroom: '31 in',
          extensions: ['Average legroom (31 in)', 'Free Wi-Fi'],
        },
      ],
      total_duration: 105,
      price: 189,
      type: 'Round trip',
      airline_logo: 'https://www.gstatic.com/flights/airline_logos/70px/WN.png',
      departure_token: 'test-round-trip-departure-token',
    },
  ],
  other_flights: [],
}

// Fixture for the second call in that flow (POST /api/search/flights/return) — the
// return-leg options matching the outbound above's departure_token. Mirrors the backend's
// serpapi_stub.py `_STUB_RETURN_FLIGHTS_RESPONSE` shape: the return-leg option is the one
// that carries the real `booking_token`, not the outbound.
export const googleReturnFlightsSearchResponse: GoogleFlightsSearchResponse = {
  search_metadata: googleFlightsSearchResponse.search_metadata,
  search_parameters: {
    engine: 'google_flights',
    hl: 'en',
    gl: 'us',
    type: '1',
    departure_id: 'AUS',
    arrival_id: 'DEN',
    outbound_date: '2026-12-01',
    return_date: '2026-12-08',
    currency: 'USD',
  },
  best_flights: [
    {
      flights: [
        {
          departure_airport: { name: 'Denver International Airport', id: 'DEN', time: '2026-12-08 17:30' },
          arrival_airport: { name: 'Austin-Bergstrom International Airport', id: 'AUS', time: '2026-12-08 20:40' },
          duration: 130,
          airplane: 'Boeing 737-800',
          airline: 'Southwest',
          airline_logo: 'https://www.gstatic.com/flights/airline_logos/70px/WN.png',
          travel_class: 'Economy',
          flight_number: 'WN 745',
          legroom: '31 in',
          extensions: ['Average legroom (31 in)', 'Free Wi-Fi'],
        },
      ],
      total_duration: 130,
      price: 205,
      type: 'Round trip',
      airline_logo: 'https://www.gstatic.com/flights/airline_logos/70px/WN.png',
      booking_token: 'test-round-trip-booking-token',
    },
  ],
  other_flights: [],
}
