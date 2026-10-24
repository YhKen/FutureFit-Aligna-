(function () {
  const form = document.querySelector("#job-form");
  const successMessage = document.querySelector("#success-message");

  const fields = [
    { id: "job-title", label: "Job title" },
    { id: "salary", label: "Salary", type: "positive-number" },
    { id: "job-description", label: "Job description" },
    { id: "job-field", label: "Job field" },
    { id: "location", label: "Location" },
    { id: "skills", label: "Skills" },
    { id: "soft-skills", label: "Soft skills" },
    { id: "job-requirements", label: "Job requirements" },
    { id: "future-skills", label: "Future required skills" },
    { id: "employee-count", label: "Number of employees", type: "positive-integer" },
    { id: "working-time", label: "Time" }
  ];

  function errorElement(id) {
    return document.querySelector(`[data-error-for="${id}"]`);
  }

  function setError(control, message, errorId) {
    control.setAttribute("aria-invalid", "true");
    const error = errorElement(errorId || control.id);
    if (error) {error.dataset.source=message;error.textContent = message;}
  }

  function clearError(control, errorId) {
    control.removeAttribute("aria-invalid");
    const error = errorElement(errorId || control.id);
    if (error) {error.textContent = "";delete error.dataset.source;}
  }

  function validateField(field) {
    const control = document.querySelector(`#${field.id}`);
    const value = control ? control.value.trim() : "";

    if (!value) {
      setError(control, `${field.label} is required.`);
      return false;
    }

    if (field.type === "positive-number" && (Number.isNaN(Number(value)) || Number(value) < 0)) {
      setError(control, "Enter a valid salary amount.");
      return false;
    }

    if (field.type === "positive-integer" && (!Number.isInteger(Number(value)) || Number(value) < 1)) {
      setError(control, "Enter a whole number of at least 1.");
      return false;
    }

    clearError(control);
    return true;
  }

  function validateEmploymentType() {
    const selected = form.querySelector('input[name="employmentType"]:checked');
    const error = errorElement("employment-type");
    if (!selected) {
      if (error) error.textContent = "Employment type is required.";
      return false;
    }
    if (error) error.textContent = "";
    return true;
  }

  fields.forEach((field) => {
    const control = document.querySelector(`#${field.id}`);
    control.addEventListener("input", () => {
      if (control.getAttribute("aria-invalid") === "true") validateField(field);
      successMessage.hidden = true;
    });
  });

  form.querySelectorAll('input[name="employmentType"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      validateEmploymentType();
      successMessage.hidden = true;
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const validFields = fields.map(validateField).every(Boolean);
    const validType = validateEmploymentType();
    const valid = validFields && validType;

    if (!valid) {
      successMessage.hidden = true;
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) {
        firstInvalid.focus();
        firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    try {
      localStorage.setItem(window.alignaSavedJobKey||"aligna-job",JSON.stringify(Object.fromEntries(new FormData(form))));
    } catch(e) { alert(window.alignaText("无法保存：浏览器存储不可用。","Could not save: browser storage is unavailable.","Gagal menyimpan: storan pelayar tidak tersedia.")); return; }
    successMessage.hidden = false;
    successMessage.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
})();
