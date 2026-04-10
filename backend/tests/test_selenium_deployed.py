from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager


APP_URL = "https://tcras.vercel.app/"
WAIT_SECS = 60
TEST_FILES_DIR = Path("/home/drv4ever/Documents/tcras_final")
TEST_CASES = [
    ("tiny_low.bin", "Low Risk"),
    ("medium_risk.bin", "Medium Risk"),
    ("high_risk.bin", "High Risk"),
]


def make_driver():
    options = Options()
    options.add_argument("--start-maximized")
    return webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)


def wait_for_analysis_result(driver, wait):
    wait.until(EC.invisibility_of_element_located((By.CSS_SELECTOR, '[data-testid="risk-analyzing-state"]')))
    risk_label = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, '[data-testid="risk-label"]')))
    risk_score = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, '[data-testid="risk-score-value"]')))
    risk_message = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, '[data-testid="risk-status-message"]')))
    return risk_label.text.strip(), risk_score.text.strip(), risk_message.text.strip()


def run_case(driver, file_name, expected_label):
    wait = WebDriverWait(driver, WAIT_SECS)
    driver.get(APP_URL)

    file_input = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="file-input"]')))
    file_input.send_keys(str(TEST_FILES_DIR / file_name))

    destination_input = wait.until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-testid="destination-ip-input"]'))
    )
    destination_input.clear()
    destination_input.send_keys("127.0.0.1")

    label, score, message = wait_for_analysis_result(driver, wait)
    if label != expected_label:
        raise AssertionError(
            f"{file_name}: expected '{expected_label}', got '{label}' (score={score}, message={message})"
        )
    print(f"{file_name}: {label} verified with score={score} and message='{message}'")


def main():
    driver = make_driver()
    try:
        for file_name, expected_label in TEST_CASES:
            run_case(driver, file_name, expected_label)
    finally:
        driver.quit()


if __name__ == "__main__":
    main()
