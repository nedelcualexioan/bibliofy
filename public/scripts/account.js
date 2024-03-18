function validatePassword() {
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const passwordMismatchAlert = document.getElementById(
    "passwordMismatchAlert",
  );

  if (newPassword != confirmPassword) {
    passwordMismatchAlert.style.display = "block";
    return false;
  } else {
    passwordMismatchAlert.style.display = "none";
    return true;
  }
}

$(document).ready(function () {
  $(".btnSubscription").on("click", function (ev) {
    $(".btnSubscription").addClass("btn-dark");
    $(".btnSubscription").removeClass("btn-outline-dark");
    $(".btnSubscription").text("Get started");
    $(this).addClass("btn-outline-dark");
    $(this).removeClass("btn-dark");
    $(this).text("Current plan");

    const plan = $(this).parent().prev().find("h4").text();
    fetch("/account/plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan: plan,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        return response.json();
      })
      .catch((error) => {
        console.log(error);
      });
  });
});
