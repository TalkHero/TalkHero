$targetFile = "C:\TalkHero\Web\question-bank\A1\english-a1.json"

$questions = @()

function Add-Question {
  param(
    [string]$Category,
    [string]$QuestionType,
    [string]$Prompt,
    [AllowNull()][string]$Passage,
    [string[]]$Options,
    [string]$CorrectAnswer,
    [string]$ExplanationUk,
    [int]$Difficulty,
    [double]$Discrimination,
    [int]$EstimatedTimeSeconds,
    [string]$Topic,
    [string[]]$Tags
  )

  $script:questions += [ordered]@{
    cefr_level            = "A1"
    category              = $Category
    question_type         = $QuestionType
    prompt                = $Prompt
    passage               = $Passage
    options               = $Options
    correct_answer        = $CorrectAnswer
    explanation_uk        = $ExplanationUk
    difficulty            = $Difficulty
    discrimination        = $Discrimination
    estimated_time_seconds = $EstimatedTimeSeconds
    topic                 = $Topic
    tags                  = $Tags
    source                = "imported"
    status                = "published"
  }
}

Add-Question `
  -Category "grammar" `
  -QuestionType "multiple_choice" `
  -Prompt "I ___ a student." `
  -Passage $null `
  -Options @("is", "are", "am", "be") `
  -CorrectAnswer "am" `
  -ExplanationUk "Із займенником I дієслово to be у теперішньому часі має форму am." `
  -Difficulty 1 `
  -Discrimination 0.8 `
  -EstimatedTimeSeconds 20 `
  -Topic "verb to be" `
  -Tags @("present-simple", "to-be", "personal-pronouns")

Add-Question `
  -Category "grammar" `
  -QuestionType "multiple_choice" `
  -Prompt "She ___ from Ukraine." `
  -Passage $null `
  -Options @("am", "have", "are", "is") `
  -CorrectAnswer "is" `
  -ExplanationUk "Із підметом she використовується форма is." `
  -Difficulty 1 `
  -Discrimination 0.8 `
  -EstimatedTimeSeconds 20 `
  -Topic "verb to be" `
  -Tags @("present-simple", "to-be")

Add-Question `
  -Category "grammar" `
  -QuestionType "multiple_choice" `
  -Prompt "They ___ football every Sunday." `
  -Passage $null `
  -Options @("plays", "play", "playing", "are play") `
  -CorrectAnswer "play" `
  -ExplanationUk "У Present Simple після they використовується базова форма дієслова без закінчення -s." `
  -Difficulty 2 `
  -Discrimination 0.9 `
  -EstimatedTimeSeconds 25 `
  -Topic "present simple" `
  -Tags @("present-simple", "affirmative")

Add-Question `
  -Category "grammar" `
  -QuestionType "multiple_choice" `
  -Prompt "Tom ___ coffee in the morning." `
  -Passage $null `
  -Options @("drink", "drinking", "drinks", "is drink") `
  -CorrectAnswer "drinks" `
  -ExplanationUk "У Present Simple після he, she або it дієслово зазвичай отримує закінчення -s." `
  -Difficulty 2 `
  -Discrimination 1 `
  -EstimatedTimeSeconds 25 `
  -Topic "present simple" `
  -Tags @("present-simple", "third-person-singular")

Add-Question `
  -Category "grammar" `
  -QuestionType "multiple_choice" `
  -Prompt "We ___ have a car." `
  -Passage $null `
  -Options @("aren't", "not", "don't", "doesn't") `
  -CorrectAnswer "don't" `
  -ExplanationUk "Заперечення в Present Simple з we утворюється за допомогою do not або скороченої форми don't." `
  -Difficulty 3 `
  -Discrimination 1 `
  -EstimatedTimeSeconds 25 `
  -Topic "present simple negatives" `
  -Tags @("present-simple", "negative")

Add-Question `
  -Category "grammar" `
  -QuestionType "multiple_choice" `
  -Prompt "___ you like music?" `
  -Passage $null `
  -Options @("Does", "Are", "Is", "Do") `
  -CorrectAnswer "Do" `
  -ExplanationUk "Загальне питання в Present Simple із you починається з допоміжного дієслова do." `
  -Difficulty 3 `
  -Discrimination 1.1 `
  -EstimatedTimeSeconds 25 `
  -Topic "present simple questions" `
  -Tags @("present-simple", "questions")

Add-Question `
  -Category "grammar" `
  -QuestionType "multiple_choice" `
  -Prompt "There ___ two books on the table." `
  -Passage $null `
  -Options @("are", "is", "am", "be") `
  -CorrectAnswer "are" `
  -ExplanationUk "Перед іменником у множині використовується конструкція there are." `
  -Difficulty 3 `
  -Discrimination 1 `
  -EstimatedTimeSeconds 25 `
  -Topic "there is and there are" `
  -Tags @("there-is", "there-are", "plural")

Add-Question `
  -Category "grammar" `
  -QuestionType "multiple_choice" `
  -Prompt "My brother can ___ very well." `
  -Passage $null `
  -Options @("swims", "swimming", "to swim", "swim") `
  -CorrectAnswer "swim" `
  -ExplanationUk "Після модального дієслова can використовується базова форма дієслова без to." `
  -Difficulty 4 `
  -Discrimination 1.1 `
  -EstimatedTimeSeconds 25 `
  -Topic "modal verb can" `
  -Tags @("can", "modal-verbs")

Add-Question `
  -Category "vocabulary" `
  -QuestionType "multiple_choice" `
  -Prompt "Which word means a person who teaches students?" `
  -Passage $null `
  -Options @("doctor", "teacher", "driver", "waiter") `
  -CorrectAnswer "teacher" `
  -ExplanationUk "Teacher — це людина, яка навчає учнів або студентів." `
  -Difficulty 1 `
  -Discrimination 0.7 `
  -EstimatedTimeSeconds 20 `
  -Topic "jobs" `
  -Tags @("jobs", "people")

Add-Question `
  -Category "vocabulary" `
  -QuestionType "multiple_choice" `
  -Prompt "Which word is a colour?" `
  -Passage $null `
  -Options @("chair", "bread", "blue", "street") `
  -CorrectAnswer "blue" `
  -ExplanationUk "Blue означає синій або блакитний колір." `
  -Difficulty 1 `
  -Discrimination 0.7 `
  -EstimatedTimeSeconds 20 `
  -Topic "colours" `
  -Tags @("colours", "basic-vocabulary")

Add-Question `
  -Category "vocabulary" `
  -QuestionType "multiple_choice" `
  -Prompt "You use a ___ to open a door." `
  -Passage $null `
  -Options @("plate", "pencil", "shoe", "key") `
  -CorrectAnswer "key" `
  -ExplanationUk "Key означає ключ, яким можна відчинити двері." `
  -Difficulty 2 `
  -Discrimination 0.8 `
  -EstimatedTimeSeconds 20 `
  -Topic "everyday objects" `
  -Tags @("objects", "home")

Add-Question `
  -Category "vocabulary" `
  -QuestionType "multiple_choice" `
  -Prompt 'Which animal says “meow”?' `
  -Passage $null `
  -Options @("dog", "cat", "horse", "bird") `
  -CorrectAnswer "cat" `
  -ExplanationUk 'Cat означає кіт або кішка. Саме кіт каже “meow”.' `
  -Difficulty 2 `
  -Discrimination 0.8 `
  -EstimatedTimeSeconds 20 `
  -Topic "animals" `
  -Tags @("animals", "basic-vocabulary")

Add-Question `
  -Category "vocabulary" `
  -QuestionType "multiple_choice" `
  -Prompt "Breakfast is the meal you eat in the ___." `
  -Passage $null `
  -Options @("afternoon", "evening", "morning", "night") `
  -CorrectAnswer "morning" `
  -ExplanationUk "Breakfast — це сніданок, який зазвичай їдять уранці." `
  -Difficulty 2 `
  -Discrimination 0.9 `
  -EstimatedTimeSeconds 20 `
  -Topic "food and daily routine" `
  -Tags @("food", "daily-routine", "time")

Add-Question `
  -Category "vocabulary" `
  -QuestionType "multiple_choice" `
  -Prompt 'The opposite of “big” is ___.' `
  -Passage $null `
  -Options @("long", "fast", "old", "small") `
  -CorrectAnswer "small" `
  -ExplanationUk "Small означає малий і є антонімом до слова big." `
  -Difficulty 3 `
  -Discrimination 0.9 `
  -EstimatedTimeSeconds 20 `
  -Topic "adjectives" `
  -Tags @("adjectives", "opposites")

Add-Question `
  -Category "vocabulary" `
  -QuestionType "multiple_choice" `
  -Prompt "Where can you borrow books?" `
  -Passage $null `
  -Options @("library", "hospital", "restaurant", "station") `
  -CorrectAnswer "library" `
  -ExplanationUk "Library означає бібліотека — місце, де можна позичати книги." `
  -Difficulty 4 `
  -Discrimination 1 `
  -EstimatedTimeSeconds 25 `
  -Topic "places in town" `
  -Tags @("places", "town")

$annaPassage = "Anna is nineteen years old. She lives in Lviv with her parents. She studies English and works in a small café at weekends."

Add-Question `
  -Category "reading" `
  -QuestionType "reading_choice" `
  -Prompt "Where does Anna live?" `
  -Passage $annaPassage `
  -Options @("Kyiv", "London", "Lviv", "Warsaw") `
  -CorrectAnswer "Lviv" `
  -ExplanationUk 'У тексті прямо сказано: “She lives in Lviv with her parents.”' `
  -Difficulty 1 `
  -Discrimination 0.8 `
  -EstimatedTimeSeconds 40 `
  -Topic "personal information" `
  -Tags @("reading", "personal-information")

Add-Question `
  -Category "reading" `
  -QuestionType "reading_choice" `
  -Prompt "When does Anna work in the café?" `
  -Passage $annaPassage `
  -Options @("Every morning", "On Mondays", "At night", "At weekends") `
  -CorrectAnswer "At weekends" `
  -ExplanationUk "У тексті сказано, що Anna works in a small café at weekends." `
  -Difficulty 2 `
  -Discrimination 0.9 `
  -EstimatedTimeSeconds 40 `
  -Topic "personal information" `
  -Tags @("reading", "work", "time")

$benPassage = "Ben gets up at seven o’clock. He has breakfast and leaves home at eight. His office is near his house, so he walks to work."

Add-Question `
  -Category "reading" `
  -QuestionType "reading_choice" `
  -Prompt "How does Ben go to work?" `
  -Passage $benPassage `
  -Options @("He drives.", "He walks.", "He takes a bus.", "He rides a bike.") `
  -CorrectAnswer "He walks." `
  -ExplanationUk 'У тексті сказано: “He walks to work.”' `
  -Difficulty 2 `
  -Discrimination 0.9 `
  -EstimatedTimeSeconds 45 `
  -Topic "daily routine" `
  -Tags @("reading", "daily-routine", "transport")

Add-Question `
  -Category "reading" `
  -QuestionType "reading_choice" `
  -Prompt "Why does Ben walk to work?" `
  -Passage $benPassage `
  -Options @(
    "He does not have breakfast.",
    "The buses are expensive.",
    "His office is near his house.",
    "He starts work at seven."
  ) `
  -CorrectAnswer "His office is near his house." `
  -ExplanationUk "Ben ходить пішки, тому що його офіс розташований недалеко від дому." `
  -Difficulty 3 `
  -Discrimination 1 `
  -EstimatedTimeSeconds 45 `
  -Topic "daily routine" `
  -Tags @("reading", "daily-routine", "reason")

$shopPassage = "Green Street Shop is open from nine in the morning until six in the evening from Monday to Saturday. On Sunday, the shop is closed."

Add-Question `
  -Category "reading" `
  -QuestionType "reading_choice" `
  -Prompt "When is Green Street Shop closed?" `
  -Passage $shopPassage `
  -Options @("On Monday", "On Wednesday", "On Saturday", "On Sunday") `
  -CorrectAnswer "On Sunday" `
  -ExplanationUk "У тексті прямо сказано, що в неділю магазин зачинений." `
  -Difficulty 4 `
  -Discrimination 1 `
  -EstimatedTimeSeconds 45 `
  -Topic "opening hours" `
  -Tags @("reading", "shops", "opening-hours")

$json = $questions | ConvertTo-Json -Depth 10

$utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)

[System.IO.File]::WriteAllText(
  $targetFile,
  $json + [Environment]::NewLine,
  $utf8WithoutBom
)

Write-Host ""
Write-Host "Question Bank generated successfully." -ForegroundColor Green
Write-Host "File: $targetFile"
Write-Host "Questions: $($questions.Count)"
