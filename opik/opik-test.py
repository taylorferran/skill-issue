"""
First test - connect to Opik and log a trace.
"""

import os
from dotenv import load_dotenv

# Load API keys from .env file
load_dotenv()

import opik
from opik import Opik

# Configure Opik
opik.configure(api_key=os.getenv("OPIK_API_KEY"))

# Create client - use your project name from Opik dashboard
client = Opik(project_name="skill-issue")

print("Connected to Opik!")

# Log a simple test trace
with opik.start_as_current_trace(
    name="test_trace",
    project_name="skill-issue",
    metadata={"test": True, "author": "Owen"}
) as trace:
    trace.update(
        input={"message": "Hello from Skill Issue!"},
        output={"status": "It works!"}
    )

print("Trace logged!")

# Make sure data is sent before script ends
opik.flush_tracker()

print("Done! Check your Opik dashboard.")