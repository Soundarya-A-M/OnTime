let map,busMarker;

function showActionButtons(){
    document.getElementById("actionButtons").style.display="block";
}

function trackBus() {
  document.getElementById("mapSection").style.display = "block";

  // Initialize map only once
  if (!map) {
    map = L.map('map').setView([12.9716, 77.5946], 13); // Example: Bangalore coordinates

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Add bus marker
    busMarker = L.marker([12.9716, 77.5946]).addTo(map)
      .bindPopup("Bus is here!")
      .openPopup();
  } else {
    // Move marker to a new location (simulate)
    const newLat = 12.9716 + (Math.random() - 0.5) * 0.01;
    const newLng = 77.5946 + (Math.random() - 0.5) * 0.01;
    busMarker.setLatLng([newLat, newLng]).update();
    map.setView([newLat, newLng], 13);
    busMarker.bindPopup("Bus is here!").openPopup();
  }
}

function viewRoute(){
    alert("Display full route...");
}
function nearbystops(){
    alert("Showing nearby stops...");
}
window.onload=function(){
   const loggedIn=localStrorage.getItem("loggedIn");
   const btn=document.getElementById("searchBtn");
   if(loggedIn==="true"){
    btn.disabled=false;
   }else{
    btn.disabled=true;
   }
  };
  const routes=[
    {
      bus:"TN-01-A123",
      from:"mysore",
      to:"chennai",
      route:"mysore->salem->chennai",
      time:"06:30AM",
      status:"on Time"
  },
  {
    bus:"KA-09-B456",
    from:"mysore",
    to:"ooty",
    route:"mysore->gundlupet->ooty",
    time:"09:15AM",
    status:"delayed"
  }
];
 function searchRoute() {
  if(localStrorage.getItem("loggedIn")!=="true"){
    alert("please login search route");
  }
  const from= document.getElementById("fromPlace").value.trim().toLowerCase();
  const to = document.getElementById("toPlace").value.trim().toLowerCase();
  const table=document.getElementById("routeTable");
   const body = document.getElementById("tableBody");

  body.innerHTML = "";

  if (from === "") {
    alert("Please enter From place");
    return;
  }

  const result = routes.filter(r =>{
    if(to===""){
     return r.from===from;
    }
     return r.from === from&&r.to.includes(to);
    });

  if (result.length === 0) {
    alert("No routes found");
    table.style.display = "none";
    return;
  }

  result.forEach(r => {
    body.innerHTML+=`
      <tr>
        <td>${r.bus}</td>
        <td>${r.from.toUpperCase()}</td>
        <td>${r.to.toUpperCase()}</td>
        <td>${r.route}</td>
        <td>${r.time}</td>
        <td>${r.status}</td>
      </tr>
    `;
  });
    table.style.display = "table";
}
const dateList = document.getElementById("dateList");
const selectedDate = document.getElementById("selectedDate");
const dateInput=document.getElementById("dateInput");

const today = new Date();

// show selected date text
selectedDate.textContent = today.toDateString();

function openCalendar(){
dateInput.click();
}
function setDate(value){
  const d=new Date(value);
  selectedDate.textContent=d.toDateString();
}
for (let i = 0; i < 5; i++) {
  const date = new Date();
  date.setDate(today.getDate() + i);

  const card = document.createElement("div");
  card.className = "date-card";

  const day = date.getDate();
  const weekDay = date.toLocaleDateString("en-US", { weekday: "short" });

  card.innerHTML = `
    <div>${day}</div>
    <div>${i === 0 ? "TODAY" : weekDay.toUpperCase()}</div>
  `;

  // highlight today
  if (i === 0) {
    card.classList.add("active");
  }

  card.onclick = () => {
    document.querySelectorAll(".date-card").forEach(c => c.classList.remove("active"));
    card.classList.add("active");
    selectedDate.textContent = date.toDateString();
  };

  dateList.appendChild(card);
}
  function toggleMenu() {
    document.getElementById("sideMenu").classList.toggle("show");
  }
function LoginUser(){
    const user=document.getElementById("username").value;
    const pass=document.getElementById("password").value;
    if(user===""||pass===""){
        alert("please fill all details");
        return;

    }
    if(user==="admin"&&pass==="1234"){
        localStorage.setItem("loggedIn","true");
        localStorage.setItem("username",user);
        window.location.href="index.html";
    } else{
      alert("invalid login details");
    }
  }
    function logout(){
        localStorage.removeItem("loggedIn");
        localStorage.removeItem("username");
        window.location.href="login.html";
    }
    function showLogin(){
      document.getElementById("loginBox").style.display="flex";
    }



    