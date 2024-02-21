$(document).ready(function () {
  const credit = $("#creditCard");
  const borrow = $("#borrowBook");
  const totalPrice = $(".totalPrice").text();

  $(".rmCart").on("click", function (ev) {
    const bookId = $(this).attr("data-value");
    const self = this;

    fetch("/cart/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId: bookId }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else if (response.status === 401) {
          window.location.href = "/api/auth/login";
          return;
        } else {
          throw new Error("Error removing from cart");
        }
      })
      .then((data) => {
        console.log(data);
        $(self)
          .parent()
          .fadeOut(300, function () {
            $(this).remove();
          });
        $(".totalProd").text(data.totalProducts);
      })
      .catch((error) => {
        if (!error.status == 401) {
          console.log(error.message);
        }
      });
  });
});
