$(document).ready(function () {
  $(".addCart").on("click", function (ev) {
    const quantity = $(".quantity").val();
    fetch("/api/book/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookId: ev.target.value,
        quantity: quantity,
      }),
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
