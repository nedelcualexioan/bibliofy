$(document).ready(() => {
  $(".addCart").on("click", (ev) => {
    fetch("/api/books/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId: ev.target.value }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else if (response.status === 401) {
          window.location.href = "/api/auth/login";
          return;
        } else {
          throw new Error("Error adding to cart");
        }
      })
      .then((data) => {
        $(".counter").text(data.cartCount);
        showNotification();
      })
      .catch((error) => {
        if (!error.status == 401) {
          console.log(error.message);
          window.location.href = "/api/books";
        }
      });
  });
});

function showNotification() {
  const feedbackBox = $("#notification-box");

  feedbackBox.text("Product added to cart");
  feedbackBox.fadeIn().delay(2000).fadeOut();
}
