const form = document.getElementById("account-form");
const scriptURL = 'https://script.google.com/macros/s/AKfycbzCMd4edza-Pk7wFnITvU3Q1jzz54YW5Djkl3mI6WxFZAXSlcebxWuuUznv-UPuvpxC3A/exec';

form.addEventListener('submit', e => {
  e.preventDefault(); // stop page reload

  fetch(scriptURL, { method: 'POST', body: new FormData(form) })
    .then(response => {
      // Google Sheets script usually returns plain text, not JSON
      return response.text();
    })
    .then(text => {
      // If your script returns "success" on success
      if (text.includes("success")) {
        window.location.href = "websitetype.html"; // redirect
      } else {
        alert("Something went wrong. Try again.");
        console.log(text);
      }
    })
    .catch(error => {
      console.error('Error!', error.message);
      alert("Error connecting to Google Sheets.");
    });
});
