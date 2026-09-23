import type { EventOption } from '../../api/events'

// Shape of the raw SerpApi engine=google response, before the backend adapter
// (search/adapters/serpapi.py::search_events) strips it down to just events_results —
// api/events.ts's GoogleEventsSearchResponse models what the client actually receives,
// which is narrower than this. Only used to type this fixture and the mock handler that
// simulates the adapter's stripping step (see handlers.ts's eventsHandlers).
type RawEventsSearchResponse = {
  search_metadata: {
    id: string
    status: string
    json_endpoint: string
    markdown_endpoint: string
    pixel_position_endpoint: string
    created_at: string
    processed_at: string
    google_url: string
    raw_html_file: string
    total_time_taken: number
  }
  search_parameters: {
    engine: string
    q: string
    location_requested: string
    location_used: string
    google_domain: string
    hl: string
    gl: string
    device: string
  }
  search_information: {
    query_displayed: string
    total_results: number
    time_taken_displayed: number
    organic_results_state: string
    spelling_fix?: string
    showing_results_for?: string
  }
  events_results: EventOption[]
}

// Fixture for GET https://serpapi.com/search.json?engine=google&q=Networking+Events...
// (engine=google, since engine=google_events was deprecated — see api/events.ts). Trimmed
// to the fields the app models; the real response also carries related_questions,
// ai_overview, organic_results, related_searches, and pagination — generic web-search
// noise from piggybacking on engine=google, not part of the events search response.
export const googleEventsSearchResponse: RawEventsSearchResponse = {
    "search_metadata": {
      "id": "6a9654ccb4ab72a0d5e197ff",
      "status": "Success",
      "json_endpoint": "https://serpapi.com/searches/OoQ-9pQYapNxPLZ2_C6J13mBe_9yTxQtJlmhHnMBcb8/6a9654ccb4ab72a0d5e197ff.json",
      "markdown_endpoint": "https://serpapi.com/searches/OoQ-9pQYapNxPLZ2_C6J13mBe_9yTxQtJlmhHnMBcb8/6a9654ccb4ab72a0d5e197ff.md",
      "pixel_position_endpoint": "https://serpapi.com/searches/OoQ-9pQYapNxPLZ2_C6J13mBe_9yTxQtJlmhHnMBcb8/6a9654ccb4ab72a0d5e197ff.json_with_pixel_position",
      "created_at": "2026-09-01 04:30:04 UTC",
      "processed_at": "2026-09-01 04:30:04 UTC",
      "google_url": "https://www.google.com/search?q=Networking+Events+October+1&oq=Networking+Events+October+1&uule=w+CAIQICIaQXVzdGluLFRleGFzLFVuaXRlZCBTdGF0ZXM&hl=en&gl=us&sourceid=chrome&ie=UTF-8",
      "raw_html_file": "https://serpapi.com/searches/OoQ-9pQYapNxPLZ2_C6J13mBe_9yTxQtJlmhHnMBcb8/6a9654ccb4ab72a0d5e197ff.html",
      "total_time_taken": 2.95
    },
    "search_parameters": {
      "engine": "google",
      "q": "Networking Events October 1",
      "location_requested": "Austin, Texas, United States",
      "location_used": "Austin,Texas,United States",
      "google_domain": "google.com",
      "hl": "en",
      "gl": "us",
      "device": "desktop"
    },
    "search_information": {
      "query_displayed": "Networking Events October 1",
      "total_results": 203000000,
      "time_taken_displayed": 0.27,
      "organic_results_state": "Some results for exact spelling but showing fixed spelling",
      "spelling_fix": "Networking Events October 1",
      "showing_results_for": "Networking Events October 1"
    },
    "events_results": [
      {
        "title": "More Than Networking: Austin Business Mastermind",
        "type": "Business networking",
        "date": "Oct 1",
        "time": "3:00 PM",
        "address": ["Mama Betty's Tex-Mex - Burnet Rd", "Austin, TX"],
        "thumbnail": "https://serpapi.com/searches/6a9654ccb4ab72a0d5e197ff/images/g_pAxin31O8fxTmrfjIMKWysrDMfoq7CtGPGsOaf8vA.jpeg"
      },
      {
        "title": "The Online Sales & Marketing Summit",
        "type": "Sales and marketing conference",
        "date": "Oct 1",
        "address": ["AT&T Hotel and Conference Center", "West University"],
        "thumbnail": "https://serpapi.com/searches/6a9654ccb4ab72a0d5e197ff/images/xmsTUiuBrvHMvyYJ8ttLnr9BCsEb9Lr9tX-jLymZbhg.jpeg"
      },
      {
        "title": "Venture PFest 2026: Ideas to Impact + Pitch Competition",
        "type": "Business innovation and pitch competition",
        "date": "Oct 1",
        "time": "9:00 AM",
        "address": [
          "Courtyard by Marriott Austin Pflugerville and Pflugerville Conference Center",
          "Pflugerville, TX"
        ],
        "thumbnail": "https://serpapi.com/searches/6a9654ccb4ab72a0d5e197ff/images/yGDUZdcHiFdazyo2G3QPz-OcxZ0_9Vt17UUDuOtiD9I.jpeg"
      },
      {
        "title": "SideHustle® LIVE Comedy Game Show for Entrepreneurs",
        "type": "Comedy game show",
        "date": "Oct 1",
        "time": "6:00 PM",
        "address": ["Pershing Hall", "East Austin"],
        "thumbnail": "https://serpapi.com/searches/6a9654ccb4ab72a0d5e197ff/images/rwnqTDpbDhccLhgdXhcXDo6W8dF1jpSE7eSGvSTYPAA.jpeg"
      },
      {
        "title": "ACGtalks: Jorge Caballero & Matthew Lyons",
        "type": "Classical guitar performance",
        "date": "Oct 1",
        "time": "5:30 PM",
        "address": ["Austin Classical Guitar", "Hyde Park"],
        "thumbnail": "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcRKs6pQha4R_wnrp4w1IbXMiOO2Gd0syJV_KF6PTA2hT8dswR0Tpl02c6T7uTdDwz8JD82fQxm_CWIHuKk"
      },
      {
        "title": "SKETCHY THURSDAYS",
        "type": "Weekly art gathering",
        "date": "Oct 1",
        "time": "7:00 PM",
        "address": ["Something Cool Studios", "East Austin"],
        "thumbnail": "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcSCmnsuInOlhUioGogzV36S4LDymdfinRi81JYRQBq40mUR5jBwhq3gxgdQ1RTaH16TqfAEof-wflCEjq8"
      },
      {
        "title": "Austin Steel Guitar Fest",
        "type": "Steel guitar music festival",
        "date": "Oct 1",
        "time": "9:00 AM",
        "address": ["Austin Marriott South", "Austin, TX"],
        "thumbnail": "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcTDF6ffpa_7GcCSM92jSglTgxXYKNGkLoji3EownQZvx57iQ41VovtRkwlurTCMiMzY1mkDjr8q2J1M6aE"
      },
      {
        "title": "Karaoke Night",
        "type": "Karaoke social gathering",
        "date": "Oct 1",
        "time": "6:00 PM",
        "address": ["The Lion’s Den Tea", "Austin, TX"],
        "thumbnail": "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcR_Vbxim6nJsmxkJr39ooY2bRE8NkPoS-xb7TUgnZga-Qdw_G4SZIWW0V54ClKN-JO116cOknUHVRKGznw"
      },
      {
        "title": "Open Mic Night- Come Join Us!",
        "type": "Live music open mic",
        "date": "Oct 1",
        "time": "6:00 PM",
        "address": ["Hops & Thyme", "Austin, TX"],
        "thumbnail": "https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcQJwQy6gL50S10ufOjyjx4BfCd2lxOO6KbkPOznDMHh-hJvyWNWZ6z9NfYD2ab1yLuXvDipwzT4RGABWFQ"
      },
      {
        "title": "Books and Brews- October Read: Born a Crime by Trevor Noah",
        "type": "Book discussion",
        "date": "Oct 1",
        "time": "5:30 PM",
        "address": ["Austin Beerworks", "Austin, TX"],
        "thumbnail": "https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcTAR-HW02s2CvtAaDC7CCoy3U-tKFd4RaKUEezrJ8YvWjPUiNqv9vPkQLFyOiiwaP9SlvbQWw3NCjcNtlA"
      }
    ]
  }
