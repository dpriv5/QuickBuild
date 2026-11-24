def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200


def test_get_tasks(client):
    response = client.get("/tasks")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_task(client):
    response = client.post(
        "/tasks",
        json={
            "title": "Automated test task",
            "description": "Testing QuickBuild API",
            "priority": "High",
            "due_date": "2026-12-01"
        }
    )

    assert response.status_code in (200, 201)

    task = response.json()

    try:
        assert task["title"] == "Automated test task"
        assert task["priority"] == "High"
        assert task["completed"] is False
        assert task["due_date"] == "2026-12-01"
    finally:
        client.delete(f"/tasks/{task['id']}")
def test_update_task(client):
    response = client.post(
        "/tasks",
        json={
            "title": "Update test",
            "priority": "Medium"
        }
    )

    assert response.status_code in (200, 201)
    task_id = response.json()["id"]

    try:
        response = client.put(
            f"/tasks/{task_id}",
            json={
                "title": "Updated task",
                "priority": "High",
                "completed": True
            }
        )

        assert response.status_code == 200

        task = response.json()

        assert task["title"] == "Updated task"
        assert task["priority"] == "High"
        assert task["completed"] is True

    finally:
        client.delete(f"/tasks/{task_id}")
def test_delete_task(client):
    response = client.post(
        "/tasks",
        json={
            "title": "Delete test",
            "priority": "Low"
        }
    )

    assert response.status_code in (200, 201)
    task_id = response.json()["id"]

    response = client.delete(f"/tasks/{task_id}")

    assert response.status_code == 200

    response = client.get("/tasks")
    assert response.status_code == 200

    assert all(
        task["id"] != task_id
        for task in response.json()
    )


def test_task_not_found(client):
    response = client.delete("/tasks/999999999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Task not found"
