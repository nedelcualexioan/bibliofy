function validatePassword() {
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const passwordMismatchAlert = document.getElementById('passwordMismatchAlert');

    if (newPassword != confirmPassword) {
        passwordMismatchAlert.style.display = "block";
        return false;
    } else {
        passwordMismatchAlert.style.display = "none";
        return true;
    }
}