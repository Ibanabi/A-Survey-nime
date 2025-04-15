document.addEventListener("DOMContentLoaded", () => {
    // Create and display the introductory popup
    const introPopup = document.createElement("div");
    introPopup.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            text-align: center;
            animation: fadeIn 0.5s ease;
        ">
            <p>Hello, this is the researcher. For the sake of anonymity I will be asking for a pseudonym. This survey will have 2 sections:</p>
            <p>(1) UGT - why you watch anime and what you get from it;</p>
            <p>(2) BIG5 - questions will be asked to see whether there's a correlation between the anime genres you watch and your personality type.</p>
            <p>For the sake of consistency, do make sure to be honest. At the end you will see what your personality type is according to the Big 5 OCEAN: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism (Emotional Instability).</p>
            <p>This will only take up to 10-15 minutes of your time. Thank you!</p>
            <button id="close-intro-popup" style="
                margin-top: 10px;
                padding: 10px 20px;
                background-color: #007BFF;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            ">Got it!</button>
        </div>
    `;

    document.body.appendChild(introPopup);

    // Add fade-in animation
    const style = document.createElement("style");
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    // Close popup logic
    document.getElementById("close-intro-popup").addEventListener("click", () => {
        introPopup.remove();
    });

    const section1 = document.getElementById("section-1");
    const section2 = document.getElementById("section-2");
    const section3 = document.getElementById("section-3");
    const thankYou = document.getElementById("thank-you");

    const toSection2Button = document.getElementById("to-section-2");
    const toSection3Button = document.getElementById("to-section-3");
    const genreForm = document.getElementById("genre-questions");

    function showScrollDownPopup() {
        const popup = document.createElement("div");
        popup.textContent = "Scroll down to continue!";
        popup.style.position = "fixed";
        popup.style.bottom = "20px"; // Place at the bottom of the screen
        popup.style.left = "50%"; // Center horizontally
        popup.style.transform = "translateX(-50%)"; // Adjust for true centering
        popup.style.backgroundColor = "rgba(0, 0, 0, 0.8)"; // Transparent dark background
        popup.style.color = "white";
        popup.style.padding = "10px 20px";
        popup.style.borderRadius = "5px";
        popup.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
        popup.style.zIndex = "1000";
        popup.style.textAlign = "center";
        document.body.appendChild(popup);

        setTimeout(() => {
            popup.remove();
        }, 3000); // Remove popup after 3 seconds
    }

    // Navigation logic
    toSection2Button.addEventListener("click", () => {
        section2.style.display = "block"; // Show section 2
        toSection2Button.style.display = "none"; // Hide the button after clicking
        showScrollDownPopup(); // Show popup
    });

    toSection3Button.addEventListener("click", () => {
        const selectedGenres = document.querySelectorAll("input[name='genre']:checked");
        if (selectedGenres.length > 3) {
            alert("You can select up to 3 genres only.");
            return;
        }

        section3.style.display = "block"; // Show section 3
        toSection3Button.style.display = "none"; // Hide the button after clicking
        showScrollDownPopup(); // Show popup

        // Show questions for selected genres
        selectedGenres.forEach(genre => {
            const genreSection = document.getElementById(`${genre.value}-Genre`);
            if (genreSection) {
                genreSection.style.display = "block";
            }
        });
    });

    // Form submission logic
    genreForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Dynamically add 'required' attribute to selected genres only
        const selectedGenres = Array.from(document.querySelectorAll("input[name='genre']:checked"))
            .map(genre => genre.value);

        // Remove 'required' from all genre fields initially
        document.querySelectorAll("#section-3 input, #section-3 textarea").forEach(input => {
            input.removeAttribute("required");
        });

        // Add 'required' to fields of selected genres
        selectedGenres.forEach(genre => {
            const genreSection = document.getElementById(`${genre}-Genre`);
            if (genreSection) {
                genreSection.querySelectorAll("input, textarea").forEach(input => {
                    input.setAttribute("required", "required");
                });
            }
        });

        // Validate the form
        if (!genreForm.checkValidity()) {
            alert("Please complete all required fields for the selected genres.");
            return;
        }

        // Collect data from Section 1
        const pseudonym = document.getElementById("pseudonym").value;
        const age = document.getElementById("age").value;
        const gender = document.getElementById("gender").value;
        const email = document.getElementById("email").value;
        const watchFrequency = document.getElementById("watch-frequency").value;
        const ugtQ1 = document.querySelector("select[name='ugt-q1']").value;
        const ugtQ2 = document.querySelector("select[name='ugt-q2']").value;

        // Collect data from Section 3
        const genreQuestions = {};
        const genreReasons = {};
        selectedGenres.forEach(genre => {
            const genreInputs = document.querySelectorAll(`#${genre}-Genre input[type='radio']:checked`);
            genreQuestions[genre] = Array.from(genreInputs).reduce((acc, input) => {
                const questionKey = input.name;
                acc[questionKey] = input.value;
                return acc;
            }, {});

            // Collect free-response answers
            const reasonTextarea = document.querySelector(`#${genre}-Genre textarea[name='${genre.toLowerCase()}-reason']`);
            if (reasonTextarea) {
                genreReasons[genre] = reasonTextarea.value;
            }
        });

        // Ensure `result` is defined before using it
        const result = calculateGenreScores(selectedGenres); // Calculate the genre scores before using it in the data object

        // Prepare data for API
        const data = {
            Pseudonym: pseudonym,
            Age: age,
            Gender: gender,
            Email: email,
            WatchFrequency: watchFrequency,
            YearLevel: document.getElementById("year-level").value, // Ensure YearLevel is included
            UGT_Questions: JSON.stringify({ ugtQ1, ugtQ2 }),
            SelectedGenres: JSON.stringify(selectedGenres),
            Action_Genre: JSON.stringify(genreQuestions.Action || {}),
            Adventure_Genre: JSON.stringify(genreQuestions.Adventure || {}),
            Comedy_Genre: JSON.stringify(genreQuestions.Comedy || {}),
            Drama_Genre: JSON.stringify(genreQuestions.Drama || {}),
            Fantasy_Genre: JSON.stringify(genreQuestions.Fantasy || {}),
            Horror_Genre: JSON.stringify(genreQuestions.Horror || {}),
            Romance_Genre: JSON.stringify(genreQuestions.Romance || {}),
            SciFi_Genre: JSON.stringify(genreQuestions.SciFi || {}),
            Genre_Reasons: JSON.stringify(genreReasons),
            Result: JSON.stringify(result) // Ensure Result is included and properly defined
        };

        try {
            // Send data to Google Sheet API
            const response = await fetch("https://sheetdb.io/api/v1/2cjorv61rowv1", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ data: [data] }) // Ensure data is sent as an array to append in the same row
            });

            if (response.ok) {
                console.log("Submission successful. Displaying thank-you page.");
                section1.style.display = "none";
                section2.style.display = "none";
                section3.style.display = "none";
                thankYou.style.display = "block"; // Only show the thank-you page
            } else {
                console.error("Submission failed with status:", response.status);
                alert("Failed to submit the survey. Please try again.");
            }
        } catch (error) {
            console.error("Error submitting the survey:", error);
            alert("An error occurred while submitting the survey. Please try again.");
        }
    });

    function calculateGenreScores(selectedGenres) {
        const traitLabels = {
            O: "Openness",
            C: "Conscientiousness",
            E: "Extraversion",
            A: "Agreeableness",
            N: "Neuroticism"
        };

        const traitDescriptions = {
            extremelyHigh: "Extremely High",
            high: "High",
            moderate: "Moderate",
            low: "Low",
            extremelyLow: "Extremely Low"
        };

        const results = selectedGenres.map(genre => {
            const scores = { O: 0, C: 0, E: 0, A: 0, N: 0 };

            // Calculate scores for each trait
            Object.keys(scores).forEach(trait => {
                for (let i = 1; i <= 5; i++) { // Assuming 5 questions per trait
                    const inputName = `${genre.toLowerCase()}-${trait.toLowerCase()}-${i}`;
                    const input = document.querySelector(`input[name='${inputName}']:checked`);
                    console.log(`Looking for input: ${inputName}`); // Debugging log
                    if (input) {
                        const value = parseInt(input.value, 10);
                        scores[trait] += value; // Sum up the scores
                        console.log(`Found input: ${inputName}, Value: ${value}`); // Debugging log
                    } else {
                        console.warn(`No input found for Genre: ${genre}, Trait: ${trait}, Question: ${i}`); // Debugging log
                    }
                }
            });

            // Calculate percentages and determine trait levels
            const traitLevels = {};
            Object.keys(scores).forEach(trait => {
                const percentage = (scores[trait] / 25) * 100; // Divide by max score (5 questions * 5 max score)
                if (percentage >= 80) {
                    traitLevels[trait] = traitDescriptions.extremelyHigh;
                } else if (percentage >= 60) {
                    traitLevels[trait] = traitDescriptions.high;
                } else if (percentage >= 40) {
                    traitLevels[trait] = traitDescriptions.moderate;
                } else if (percentage >= 20) {
                    traitLevels[trait] = traitDescriptions.low;
                } else {
                    traitLevels[trait] = traitDescriptions.extremelyLow;
                }
            });

            return { genre, scores, percentages: {
                O: (scores.O / 25) * 100,
                C: (scores.C / 25) * 100,
                E: (scores.E / 25) * 100,
                A: (scores.A / 25) * 100,
                N: (scores.N / 25) * 100
            }, traitLevels };
        });

        return results;
    }

    function ensureInputsAreVisible(selectedGenres) {
        selectedGenres.forEach(genre => {
            const genreSection = document.getElementById(`${genre}-Genre`);
            if (genreSection) {
                genreSection.style.display = "block"; // Ensure the section is visible
            }
        });
    }

    function displayResultsPopup(results) {
        const popup = document.createElement("div");
        popup.style.position = "fixed";
        popup.style.top = "50%";
        popup.style.left = "50%";
        popup.style.transform = "translate(-50%, -50%)";
        popup.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
        popup.style.color = "white";
        popup.style.padding = "20px";
        popup.style.borderRadius = "10px";
        popup.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
        popup.style.zIndex = "1000";
        popup.style.textAlign = "center";
        popup.style.maxWidth = "80%";
        popup.style.overflowY = "auto";

        let content = "<h2>The Results Are:</h2>";
        results.forEach(result => {
            content += `<h3>${result.genre}</h3>`;
            content += `<p>Openness: ${result.traitLevels.O}</p>`;
            content += `<p>Conscientiousness: ${result.traitLevels.C}</p>`;
            content += `<p>Extraversion: ${result.traitLevels.E}</p>`;
            content += `<p>Agreeableness: ${result.traitLevels.A}</p>`;
            content += `<p>Neuroticism: ${result.traitLevels.N}</p>`;
        });

        popup.innerHTML = content + '<button id="close-results-popup" style="margin-top: 10px; padding: 10px 20px; background-color: #007BFF; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>';

        document.body.appendChild(popup);

        document.getElementById("close-results-popup").addEventListener("click", () => {
            popup.remove();
        });
    }

    
    function calculateAndDisplayGenreScores() {
        const selectedGenres = Array.from(document.querySelectorAll("input[name='genre']:checked"))
            .map(input => input.value);

        const traitLabels = {
            O: "Openness",
            C: "Conscientiousness",
            E: "Extraversion",
            A: "Agreeableness",
            N: "Neuroticism"
        };

        const results = selectedGenres.map(genre => {
            const scores = { O: 0, C: 0, E: 0, A: 0, N: 0 };

            // Calculate scores for each trait for the selected genre
            Object.keys(scores).forEach(trait => {
                for (let i = 1; i <= 5; i++) { // Assuming 5 questions per trait
                    const inputName = `${genre.toLowerCase()}-${trait.toLowerCase()}-${i}`;
                    const input = document.querySelector(`input[name='${inputName}']:checked`);
                    if (input) {
                        scores[trait] += parseInt(input.value, 10); // Sum up the scores
                    }
                }
            });

            return {
                genre,
                scores
            };
        });

        // Create a popup to display the results
        const popup = document.createElement("div");
        popup.style.position = "fixed";
        popup.style.top = "50%";
        popup.style.left = "50%";
        popup.style.transform = "translate(-50%, -50%)";
        popup.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
        popup.style.color = "white";
        popup.style.padding = "20px";
        popup.style.borderRadius = "10px";
        popup.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
        popup.style.zIndex = "1000";
        popup.style.textAlign = "center";
        popup.style.maxWidth = "80%";
        popup.style.overflowY = "auto";

        let content = "<h2>Personality Traits by Genre</h2><table style='width: 100%; border-collapse: collapse;'>";
        content += "<tr><th style='border: 1px solid white; padding: 8px;'>Genre</th>";
        Object.values(traitLabels).forEach(label => {
            content += `<th style='border: 1px solid white; padding: 8px;'>${label}</th>`;
        });
        content += "</tr>";

        results.forEach(result => {
            content += `<tr><td style='border: 1px solid white; padding: 8px;'>${result.genre}</td>`;
            Object.keys(result.scores).forEach(trait => {
                content += `<td style='border: 1px solid white; padding: 8px;'>${result.scores[trait]}</td>`;
            });
            content += "</tr>";
        });

        content += "</table><button id='close-popup' style='margin-top: 10px; padding: 10px 20px; background-color: #007BFF; color: white; border: none; border-radius: 5px; cursor: pointer;'>Close</button>";
        popup.innerHTML = content;

        document.body.appendChild(popup);

        document.getElementById("close-popup").addEventListener("click", () => {
            popup.remove();
        });
    }

    // Show results on thank-you page
    const thankYouPage = document.getElementById("thank-you");
    const observer = new MutationObserver(() => {
        if (thankYouPage.style.display === "block") {
            const selectedGenres = Array.from(document.querySelectorAll("input[name='genre']:checked")).map(input => input.value);
            ensureInputsAreVisible(selectedGenres);
            const results = calculateGenreScores(selectedGenres);
            displayResultsPopup(results);
            saveResultToGoogleSheet(results);
        }
    });

    observer.observe(thankYouPage, { attributes: true, attributeFilter: ["style"] });
});


