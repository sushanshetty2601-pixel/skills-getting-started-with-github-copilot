from fastapi.testclient import TestClient

from src.app import app, activities


client = TestClient(app)


def test_get_activities_includes_participants_list():
    response = client.get("/activities")

    assert response.status_code == 200
    payload = response.json()
    assert "Chess Club" in payload
    assert isinstance(payload["Chess Club"]["participants"], list)
    assert payload["Chess Club"]["participants"] == [
        "michael@mergington.edu",
        "daniel@mergington.edu",
    ]


def test_signup_adds_participant_and_rejects_duplicates():
    activity_name = "Basketball Team"
    original_participants = activities[activity_name]["participants"][:]
    activities[activity_name]["participants"] = []

    try:
        first_signup = client.post(
            f"/activities/{activity_name}/signup?email=student@mergington.edu"
        )
        assert first_signup.status_code == 200
        assert first_signup.json()["message"] == (
            "Signed up student@mergington.edu for Basketball Team"
        )
        assert activities[activity_name]["participants"] == ["student@mergington.edu"]

        duplicate_signup = client.post(
            f"/activities/{activity_name}/signup?email=student@mergington.edu"
        )
        assert duplicate_signup.status_code == 400
        assert duplicate_signup.json()["detail"] == "Student is already signed up"
    finally:
        activities[activity_name]["participants"] = original_participants


def test_unregister_removes_participant():
    activity_name = "Basketball Team"
    original_participants = activities[activity_name]["participants"][:]
    activities[activity_name]["participants"] = ["student@mergington.edu"]

    try:
        response = client.delete(
            f"/activities/{activity_name}/participants/student@mergington.edu"
        )
        assert response.status_code == 200
        assert response.json()["message"] == (
            "Unregistered student@mergington.edu from Basketball Team"
        )
        assert activities[activity_name]["participants"] == []
    finally:
        activities[activity_name]["participants"] = original_participants
