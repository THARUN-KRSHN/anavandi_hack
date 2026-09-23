"""Comprehensive API test suite for KSRTC Passenger Grievance Backend."""

import uuid
import pytest
from app import create_app
from app.services.escalation_service import check_escalations


@pytest.fixture(scope="module")
def app():
    """Create test application using seeded database."""
    flask_app = create_app()
    flask_app.config.update({
        "TESTING": True,
        "DEBUG": False,
    })
    return flask_app


@pytest.fixture(scope="module")
def client(app):
    return app.test_client()


@pytest.fixture(scope="module")
def admin_token(client):
    res = client.post("/api/auth/login", json={
        "email": "admin@demo.com",
        "password": "admin123",
    })
    assert res.status_code == 200
    return res.get_json()["data"]["token"]


@pytest.fixture(scope="module")
def passenger_token(client):
    res = client.post("/api/auth/login", json={
        "email": "user@demo.com",
        "password": "user123",
    })
    assert res.status_code == 200
    return res.get_json()["data"]["token"]


@pytest.fixture(scope="module")
def depot_head_token(client):
    res = client.post("/api/auth/login", json={
        "email": "head@adoor.demo",
        "password": "depot123",
    })
    assert res.status_code == 200
    return res.get_json()["data"]["token"]


# ---------------------------------------------------------------------------
# 1. Health Check
# ---------------------------------------------------------------------------
def test_health_check(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "healthy"


# ---------------------------------------------------------------------------
# 2. Authentication Tests
# ---------------------------------------------------------------------------
def test_login_invalid_password(client):
    res = client.post("/api/auth/login", json={
        "email": "user@demo.com",
        "password": "wrongpassword",
    })
    assert res.status_code == 401
    assert res.get_json()["error"]["code"] == "INVALID_CREDENTIALS"


def test_login_missing_fields(client):
    res = client.post("/api/auth/login", json={"email": "user@demo.com"})
    assert res.status_code == 400


def test_signup_new_user(client):
    rand_email = f"test_{uuid.uuid4().hex[:8]}@demo.com"
    res = client.post("/api/auth/signup", json={
        "name": "Automated Tester",
        "email": rand_email,
        "phone": "+919876543210",
        "password": "password123",
    })
    assert res.status_code == 201
    data = res.get_json()["data"]
    assert "token" in data
    assert data["user"]["email"] == rand_email


def test_signup_duplicate_email(client):
    res = client.post("/api/auth/signup", json={
        "name": "Duplicate User",
        "email": "user@demo.com",
        "password": "password123",
    })
    assert res.status_code == 400
    assert res.get_json()["error"]["code"] == "EMAIL_EXISTS"


# ---------------------------------------------------------------------------
# 3. User Profile Tests
# ---------------------------------------------------------------------------
def test_get_user_profile(client, passenger_token):
    res = client.get(
        "/api/users/me",
        headers={"Authorization": f"Bearer {passenger_token}"},
    )
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert data["email"] == "user@demo.com"


def test_update_user_profile(client, passenger_token):
    res = client.put(
        "/api/users/me",
        headers={"Authorization": f"Bearer {passenger_token}"},
        json={"name": "Updated Demo User"},
    )
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert data["name"] == "Updated Demo User"


# ---------------------------------------------------------------------------
# 4. Bus, Route, Depot Endpoints
# ---------------------------------------------------------------------------
def test_list_depots(client, passenger_token):
    res = client.get(
        "/api/depots",
        headers={"Authorization": f"Bearer {passenger_token}"},
    )
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert len(data) >= 90  # 97 depots from CSV


def test_list_buses(client, passenger_token):
    res = client.get(
        "/api/buses",
        headers={"Authorization": f"Bearer {passenger_token}"},
    )
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert len(data) > 0


def test_list_routes(client, passenger_token):
    res = client.get(
        "/api/routes",
        headers={"Authorization": f"Bearer {passenger_token}"},
    )
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert len(data) > 0


# ---------------------------------------------------------------------------
# 5. Complaint Submission & Lifecycle
# ---------------------------------------------------------------------------
def test_complaint_submission_and_retrieval(client, passenger_token):
    # 1. Fetch a bus and route to attach
    buses = client.get("/api/buses", headers={"Authorization": f"Bearer {passenger_token}"}).get_json()["data"]
    routes = client.get("/api/routes", headers={"Authorization": f"Bearer {passenger_token}"}).get_json()["data"]

    bus_id = buses[0]["id"]
    route_id = routes[0]["id"]

    # 2. Submit complaint
    res = client.post(
        "/api/complaints",
        headers={"Authorization": f"Bearer {passenger_token}"},
        json={
            "category": "CLEANLINESS",
            "description": "Seats are dusty and windows are jammed.",
            "bus_id": bus_id,
            "route_id": route_id,
            "reported_at": "2026-09-23T08:30:00Z",
        },
    )
    assert res.status_code == 201
    created = res.get_json()["data"]
    ref = created["reference_number"]
    assert ref.startswith("GRV-")
    assert created["status"] == "SUBMITTED"

    # 3. View my complaints
    my_res = client.get(
        "/api/complaints/mine",
        headers={"Authorization": f"Bearer {passenger_token}"},
    )
    assert my_res.status_code == 200
    my_list = my_res.get_json()["data"]["complaints"]
    assert any(c["reference_number"] == ref for c in my_list)

    # 4. View complaint detail with timeline
    detail_res = client.get(
        f"/api/complaints/{ref}",
        headers={"Authorization": f"Bearer {passenger_token}"},
    )
    assert detail_res.status_code == 200
    detail = detail_res.get_json()["data"]
    assert detail["reference_number"] == ref
    assert "timeline" in detail
    assert len(detail["timeline"]) >= 1

    # 5. Download PDF
    pdf_res = client.get(
        f"/api/complaints/{ref}/pdf",
        headers={"Authorization": f"Bearer {passenger_token}"},
    )
    assert pdf_res.status_code == 200
    assert pdf_res.content_type == "application/pdf"
    assert len(pdf_res.data) > 500  # valid PDF bytes


def test_complaint_duplicate_request_is_idempotent(client, passenger_token):
    buses = client.get("/api/buses", headers={"Authorization": f"Bearer {passenger_token}"}).get_json()["data"]
    routes = client.get("/api/routes", headers={"Authorization": f"Bearer {passenger_token}"}).get_json()["data"]

    payload = {
        "category": "CLEANLINESS",
        "description": "Duplicate request id should be rejected after the first submission.",
        "bus_id": buses[0]["id"],
        "route_id": routes[0]["id"],
        "reported_at": "2026-09-23T09:45:00Z",
        "client_request_id": f"dup-request-{__import__('uuid').uuid4()}",
    }

    first = client.post("/api/complaints", headers={"Authorization": f"Bearer {passenger_token}"}, json=payload)
    assert first.status_code == 201
    first_ref = first.get_json()["data"]["reference_number"]

    second = client.post("/api/complaints", headers={"Authorization": f"Bearer {passenger_token}"}, json=payload)
    assert second.status_code == 409
    assert second.get_json()["error"]["code"] == "DUPLICATE_REQUEST"
    assert second.get_json()["error"]["reference_number"] == first_ref


def test_conductor_action_accepts_new_statuses(client, depot_head_token):
    complaints_res = client.get("/api/depot/complaints", headers={"Authorization": f"Bearer {depot_head_token}"})
    complaints = complaints_res.get_json()["data"]["complaints"]
    assert len(complaints) > 0

    conductors_res = client.get("/api/depot/conductors", headers={"Authorization": f"Bearer {depot_head_token}"})
    conductors = conductors_res.get_json()["data"]
    assert len(conductors) > 0

    complaint_id = complaints[0]["id"]
    conductor_id = conductors[0]["id"]

    notify_res = client.post(
        f"/api/depot/complaints/{complaint_id}/notify-conductor",
        headers={"Authorization": f"Bearer {depot_head_token}"},
        json={"conductor_id": conductor_id},
    )
    assert notify_res.status_code == 200

    action_url = notify_res.get_json()["data"]["action_url"]
    token = action_url.split("/")[-1]

    action_post = client.post(f"/api/conductor/action/{token}", json={"status": "ACTION_TAKEN", "comment": "Action taken."})
    assert action_post.status_code == 200
    assert action_post.get_json()["data"]["status"] == "ACTION_TAKEN"


# ---------------------------------------------------------------------------
# 6. Depot Head Endpoints & Conductor Workflow
# ---------------------------------------------------------------------------
def test_depot_head_dashboard(client, depot_head_token):
    res = client.get(
        "/api/depot/dashboard",
        headers={"Authorization": f"Bearer {depot_head_token}"},
    )
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert "total" in data
    assert "resolved" in data
    assert "category_breakdown" in data


def test_depot_head_complaints_list(client, depot_head_token):
    res = client.get(
        "/api/depot/complaints?status=SUBMITTED",
        headers={"Authorization": f"Bearer {depot_head_token}"},
    )
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert "complaints" in data


def test_depot_conductor_sms_and_action(client, depot_head_token):
    # Find a complaint in Adoor depot
    complaints_res = client.get(
        "/api/depot/complaints",
        headers={"Authorization": f"Bearer {depot_head_token}"},
    )
    complaints = complaints_res.get_json()["data"]["complaints"]
    assert len(complaints) > 0
    target_complaint = complaints[0]
    complaint_id = target_complaint["id"]

    # Conductor list in this depot
    conductors_res = client.get(
        "/api/depot/conductors",
        headers={"Authorization": f"Bearer {depot_head_token}"},
    )
    conductors = conductors_res.get_json()["data"]
    assert len(conductors) > 0
    conductor_id = conductors[0]["id"]

    # Trigger notify-conductor
    notify_res = client.post(
        f"/api/depot/complaints/{complaint_id}/notify-conductor",
        headers={"Authorization": f"Bearer {depot_head_token}"},
        json={"conductor_id": conductor_id},
    )
    assert notify_res.status_code == 200
    notify_data = notify_res.get_json()["data"]
    action_url = notify_data["action_url"]
    token = action_url.split("/")[-1]

    # Test GET action page (public, no auth needed)
    action_get = client.get(f"/api/conductor/action/{token}")
    assert action_get.status_code == 200
    action_data = action_get.get_json()["data"]
    assert "reference_number" in action_data

    # Test POST action page (public, updates status)
    action_post = client.post(
        f"/api/conductor/action/{token}",
        json={"status": "UNDER_REVIEW", "comment": "Conductor inspecting issue."},
    )
    assert action_post.status_code == 200

    # Test token is single use — subsequent request must fail
    reuse_post = client.post(
        f"/api/conductor/action/{token}",
        json={"status": "RESOLVED", "comment": "Trying again."},
    )
    assert reuse_post.status_code == 400


def test_depot_export_csv_and_xlsx(client, depot_head_token):
    # CSV export
    csv_res = client.get(
        "/api/depot/export?format=csv",
        headers={"Authorization": f"Bearer {depot_head_token}"},
    )
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.content_type

    # XLSX export
    xlsx_res = client.get(
        "/api/depot/export?format=xlsx",
        headers={"Authorization": f"Bearer {depot_head_token}"},
    )
    assert xlsx_res.status_code == 200
    assert "spreadsheetml" in xlsx_res.content_type


# ---------------------------------------------------------------------------
# 7. Admin Endpoints
# ---------------------------------------------------------------------------
def test_admin_dashboard(client, admin_token):
    res = client.get(
        "/api/admin/dashboard",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert data["total_depots"] == 97
    assert data["total_complaints"] >= 200


def test_admin_depots_map(client, admin_token):
    res = client.get(
        "/api/admin/depots/map",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert len(data) == 97
    # Hero depots should have color statuses
    statuses = {d["depot_code"]: d["status"] for d in data}
    assert "GREEN" in statuses.values()


def test_admin_depot_detail(client, admin_token):
    res = client.get(
        "/api/admin/depots/1",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert "recent_complaints" in data
    assert "escalated_complaints" in data


def test_admin_notify_depot(client, admin_token):
    res = client.post(
        "/api/admin/depots/1/notify",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "subject": "Urgent Inspection",
            "message": "Please review escalated cleanliness complaints immediately.",
        },
    )
    assert res.status_code == 200


# ---------------------------------------------------------------------------
# 8. Escalation Service Execution
# ---------------------------------------------------------------------------
def test_escalation_engine(app):
    """Ensure the escalation background job executes without errors."""
    check_escalations(app)
