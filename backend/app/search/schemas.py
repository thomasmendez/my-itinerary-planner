from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.validation import IsoDate, IsoDateOrEmpty


class FlightSearchParams(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    from_: str = Field(alias="from")
    to: str
    depart: IsoDate
    return_: IsoDateOrEmpty = Field(default="", alias="return")
    travelers: int = 1
    # Defaults match SerpApi's own defaults, so an untouched form is unaffected.
    travel_class: int = 1  # 1 Economy, 2 Premium economy, 3 Business, 4 First
    sort_by: int = 1  # 1 Top flights, 2 Price, 3 Departure time, 4 Arrival time, 5 Duration, 6 Emissions
    stops: int = 0  # 0 Any, 1 Nonstop only, 2 1 stop or fewer, 3 2 stops or fewer
    max_price: int | None = None


class HotelSearchParams(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    location: str
    check_in: IsoDate = Field(alias="checkIn")
    check_out: IsoDate = Field(alias="checkOut")
    guests: int = 1
    # None means "unset", matching SerpApi's own default of no filter.
    sort_by: int | None = None  # 3 Lowest price, 8 Highest rating, 13 Most reviewed
    min_price: int | None = None
    max_price: int | None = None
    rating: int | None = None  # 7 3.5+, 8 4.0+, 9 4.5+


class EventSearchParams(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    location: str
    event_name: str = Field(default="", alias="eventName")
    start_date: IsoDateOrEmpty = Field(default="", alias="startDate")
    end_date: IsoDateOrEmpty = Field(default="", alias="endDate")

    @field_validator("location")
    @classmethod
    def _city_state(cls, v: str) -> str:
        parts = [p.strip() for p in v.split(",")]
        if len(parts) != 2 or not all(parts):
            raise ValueError(f"must be 'City, State', got {v!r}")
        return ", ".join(parts)


class FlightBookingLinkParams(BaseModel):
    """Re-issues a prior flight search with its booking_token to fetch real booking
    options for that one selected flight — SerpApi's google_flights engine requires the
    original departure/arrival/date/type alongside booking_token, not just the token."""

    departure_id: str
    arrival_id: str
    outbound_date: IsoDate
    return_date: IsoDateOrEmpty = ""
    type: str = "2"
    booking_token: str


class ReturnFlightsParams(BaseModel):
    """Round trip's second required SerpApi call: re-issues the same route/dates with a
    prior outbound result's departure_token to fetch that leg's matching return-flight
    options."""

    departure_id: str
    arrival_id: str
    outbound_date: IsoDate
    return_date: IsoDate
    departure_token: str


class HotelBookingLinkParams(BaseModel):
    """Re-issues a property's property_token against SerpApi's google_hotels engine to
    fetch that property's own booking link — requires the same check-in/out/adults/query
    text (`q`) the original search used; SerpApi 400s on a property-details lookup with a
    token but no `q`."""

    property_token: str
    location: str
    check_in_date: IsoDate
    check_out_date: IsoDate
    adults: int = 1


# --- Raw upstream response shapes -------------------------------------------------
# Documentation-only models for SerpApi's two booking-link follow-up responses
# (get_flight_booking_link / get_hotel_booking_link in adapters/serpapi.py). The
# adapters still narrow the raw response down to {url, post_data} / {url, address} by
# hand rather than validating against these - a strict schema would turn a harmless
# missing field in a real, occasionally-inconsistent upstream payload into a 500.


class FlightAirportRaw(BaseModel):
    name: str
    id: str
    time: str


class FlightLegRaw(BaseModel):
    departure_airport: FlightAirportRaw
    arrival_airport: FlightAirportRaw
    duration: int
    airplane: str
    airline: str
    airline_logo: str
    travel_class: str
    flight_number: str
    ticket_also_sold_by: list[str] | None = None
    legroom: str | None = None
    extensions: list[str] | None = None
    often_delayed_by_over_30_min: bool | None = None
    plane_and_crew_by: str | None = None


class FlightLayoverRaw(BaseModel):
    duration: int
    name: str
    id: str
    overnight: bool | None = None


class FlightCarbonEmissionsRaw(BaseModel):
    this_flight: int
    typical_for_this_route: int
    difference_percent: int


class FlightSelectedOption(BaseModel):
    flights: list[FlightLegRaw]
    layovers: list[FlightLayoverRaw] | None = None
    total_duration: int
    carbon_emissions: FlightCarbonEmissionsRaw | None = None
    type: str
    airline_logo: str


class FlightBookingRequest(BaseModel):
    url: str
    post_data: str | None = None


class FlightBookingOptionDetail(BaseModel):
    book_with: str
    airline: bool
    airline_logos: list[str]
    marketed_as: list[str]
    price: int
    option_title: str
    extensions: list[str]
    baggage_prices: list[str]
    booking_request: FlightBookingRequest


class FlightBookingOption(BaseModel):
    together: FlightBookingOptionDetail


class FlightPriceInsightsRaw(BaseModel):
    lowest_price: int
    price_level: str
    typical_price_range: tuple[int, int]
    price_history: list[tuple[int, int]]


class FlightBookingSearchMetadata(BaseModel):
    id: str
    status: str
    json_endpoint: str
    markdown_endpoint: str
    created_at: str
    processed_at: str
    google_flights_url: str
    raw_html_file: str
    prettify_html_file: str
    total_time_taken: float


class FlightBookingSearchParameters(BaseModel):
    engine: str
    hl: str
    gl: str
    type: str
    departure_id: str
    arrival_id: str
    outbound_date: str
    booking_token: str
    currency: str


class FlightBaggagePrices(BaseModel):
    together: list[str]


class FlightBookingTokenResponse(BaseModel):
    """Raw shape of SerpApi's booking-token follow-up call — the second google_flights
    request get_flight_booking_link makes with booking_token attached. Carries real
    booking_options (price tiers, baggage, the actual booking_request to POST), unlike a
    plain search result which only carries a booking_token."""

    search_metadata: FlightBookingSearchMetadata
    search_parameters: FlightBookingSearchParameters
    selected_flights: list[FlightSelectedOption]
    baggage_prices: FlightBaggagePrices
    booking_options: list[FlightBookingOption]
    price_insights: FlightPriceInsightsRaw | None = None


class HotelGpsCoordinatesRaw(BaseModel):
    latitude: float
    longitude: float


class HotelAmenityDetailInfo(BaseModel):
    snippet: str
    snippet_original: str
    snippet_highlighted_words: list[str]
    link: str
    displayed_link: str
    title: str
    source_logo: str


class HotelAmenityDetail(BaseModel):
    title: str
    label: str | None = None
    available: bool
    details: HotelAmenityDetailInfo | None = None


class HotelAmenityGroup(BaseModel):
    title: str
    list: list[HotelAmenityDetail]


class HotelAmenitiesDetailed(BaseModel):
    groups: list[HotelAmenityGroup]
    popular: list[HotelAmenityDetail] | None = None


class HotelHealthSafety(BaseModel):
    groups: list[HotelAmenityGroup]
    details_link: str | None = None


class HotelSustainability(BaseModel):
    groups: list[HotelAmenityGroup]


class HotelTransportation(BaseModel):
    type: str
    duration: str


class HotelNearbyPlace(BaseModel):
    category: str
    name: str
    link: str | None = None
    thumbnail: str | None = None
    transportations: list[HotelTransportation]
    rating: float | None = None
    reviews: int | None = None
    description: str | None = None
    gps_coordinates: HotelGpsCoordinatesRaw


class HotelImageRaw(BaseModel):
    thumbnail: str
    original_image: str


class HotelReviewBreakdown(BaseModel):
    name: str
    description: str
    total_mentioned: int
    positive: int
    negative: int
    neutral: int
    category_token: str
    serpapi_link: str


class HotelReviewScore(BaseModel):
    score: float
    max_score: float


class HotelUserReview(BaseModel):
    username: str
    date: str
    rating: HotelReviewScore
    comment: str
    link: str | None = None


class HotelOtherReview(BaseModel):
    source: str
    source_icon: str
    source_rating: HotelReviewScore
    reviews: int
    user_review: HotelUserReview
    source_number: int
    serpapi_link: str


class HotelPropertyTotalTimeTaken(BaseModel):
    float: float


class HotelPropertySearchMetadata(BaseModel):
    id: str
    status: str
    json_endpoint: str
    markdown_endpoint: str
    created_at: str
    processed_at: str
    google_hotels_url: str
    raw_html_file: str
    prettify_html_file: str
    total_time_taken: HotelPropertyTotalTimeTaken


class HotelPropertySearchParameters(BaseModel):
    engine: str
    q: str
    gl: str
    hl: str
    currency: str
    check_in_date: str
    check_out_date: str
    adults: int
    children: int
    property_token: str


class HotelPriceRange(BaseModel):
    extracted_lowest: int
    extracted_highest: int


class HotelRatingBreakdown(BaseModel):
    stars: int
    count: int


class HotelPropertyDetailsResponse(BaseModel):
    """Raw shape of SerpApi's property-details follow-up call — the second google_hotels
    request get_hotel_booking_link makes with property_token attached. Much richer than a
    search result: full description, reviews/ratings breakdown, nearby places, and
    detailed amenities instead of the search response's trimmed rate/rating summary."""

    search_metadata: HotelPropertySearchMetadata
    search_parameters: HotelPropertySearchParameters
    type: str
    name: str
    description: str
    link: str
    property_token: str
    address: str
    directions: str | None = None
    phone: str | None = None
    phone_link: str | None = None
    gps_coordinates: HotelGpsCoordinatesRaw
    check_in_time: str
    check_out_time: str
    typical_price_range: HotelPriceRange
    nearby_places: list[HotelNearbyPlace]
    hotel_class: str | None = None
    extracted_hotel_class: int | None = None
    images: list[HotelImageRaw]
    overall_rating: float
    reviews: int
    ratings: list[HotelRatingBreakdown]
    location_rating: float | None = None
    reviews_breakdown: list[HotelReviewBreakdown] | None = None
    amenities: list[str]
    excluded_amenities: list[str] | None = None
    amenities_detailed: HotelAmenitiesDetailed
    health_and_safety: HotelHealthSafety | None = None
    sustainability: HotelSustainability | None = None
    eco_certified: bool | None = None
    other_reviews: list[HotelOtherReview] | None = None
    serpapi_google_hotels_reviews_link: str | None = None
    serpapi_google_hotels_photos_link: str | None = None
