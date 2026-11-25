import os

import pytest
from fastapi.testclient import TestClient

os.environ["DATABASE_URL"] = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+psycopg:///quickbuild_test"
)

from main import app
from database import engine


@pytest.fixture
def client():
    assert engine.url.database == "quickbuild_test"

    with TestClient(app) as test_client:
        yield test_client