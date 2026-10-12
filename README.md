# ResultLens NG

### Evidence-Based Election Verification

**Developed by Team CivicLens**

**Team Members:** Matthew Falade and Gabriel Olaogun

**Event:** Young Data Professionals 2026 Datathon

**Track:** Politics and Governance

[**Explore the Live Application**](https://civiclens-matthew-falades-projects.vercel.app/trace?id=ekiti-gov-2026-ec8a-0003)

YouTube Demonstration: https://youtu.be/lHLi8gUaM2Q?si=UNZO26HAEeGPHIcb

---

## 1. Project Overview

**ResultLens NG is a civic technology project designed to make election result verification more systematic, transparent, and traceable at the polling-unit level.**

Developed by Team CivicLens for the Politics and Governance track of the Young Data Professionals 2026 Datathon, the project focuses on helping reviewers examine election-result data, identify numerical inconsistencies, investigate unusual turnout patterns, and trace records to their supporting evidence.

Election results are recorded across many individual polling units. Reviewing large volumes of numerical records and scanned result sheets manually can be time-consuming, particularly when reviewers need to compare figures, identify missing information, and establish whether records are consistent with their supporting documents.

ResultLens NG aims to address this challenge by combining a web-based interface with data analysis and explainable verification rules. The project focuses on individual polling units, allowing reviewers to examine records in detail rather than relying exclusively on aggregated state or local government statistics.

The initial project focus is Nigeria, with particular attention to polling-unit-level election data associated with the 2026 Ekiti State governorship election.

**Our guiding principle is simple: every flag should have an explanation, every finding should be traceable to evidence, and every flagged record should remain open to human review.**

## 2. The Problem We Are Solving

Transparent elections require more than publishing results. Reviewers also need practical ways to examine the consistency, completeness, and traceability of the records supporting those results.

Several challenges motivate ResultLens NG:

* **Large volumes of election data:** Reviewing results across numerous polling units manually can be slow and resource-intensive.
* **Numerical inconsistencies:** Figures for accredited voters, valid votes, rejected ballots, spoiled ballot papers, and total used ballot papers may not reconcile.
* **Unusual turnout patterns:** A polling unit's turnout may differ substantially from other polling units in the same ward or local government area.
* **Fragmented evidence:** Structured election datasets and scanned polling-unit result sheets may need to be examined together.
* **Limited traceability:** Reviewers need to connect an identified issue to the relevant polling unit, numerical figures, and source evidence.
* **Inconsistent review processes:** A repeatable verification workflow can help reviewers apply the same checks across multiple records.

These challenges do not automatically indicate electoral misconduct. They create a need for systematic checks and further examination.

ResultLens NG is designed to support this examination without replacing the role of election authorities, independent observers, or established legal procedures.

## 3. Our Solution

ResultLens NG is being developed as an evidence-based election verification and tracing system.

It aims to organise polling-unit records, apply transparent data-validation rules, compare turnout patterns across relevant geographic groups, and help reviewers investigate discrepancies.

The intended workflow is:

1. Select an election and polling-unit record.
2. Examine registered voters, accredited voters, ballot figures, and available candidate results.
3. Apply arithmetic and data-quality checks.
4. Compare turnout with relevant polling units in the same ward or local government area.
5. Identify records requiring further verification.
6. Trace findings to supporting result sheets or source references where available.
7. Record findings for human review.

By making the verification process explainable and traceable, ResultLens NG aims to help users move from large election datasets to specific records that deserve closer examination.

## 4. Key Features

### 4.1 Polling-Unit-Level Verification

The polling unit is the primary unit of analysis.

Each record can be associated with its state, local government area (LGA), registration area or ward, polling-unit identifier, numerical results, and available source references.

This structure enables reviewers to investigate individual records and understand where a potential inconsistency occurs.

### 4.2 Numerical Integrity Checks

Where the required data is available, ResultLens NG can apply rules to examine relationships between recorded election figures.

Examples include:

* Checking whether accredited voters exceed registered voters.
* Checking whether valid votes exceed accredited voters.
* Recalculating whether valid votes, rejected ballots, and spoiled ballot papers reconcile with total used ballot papers.
* Checking whether used and unused ballot papers reconcile with ballot papers issued.
* Identifying missing, invalid, or inconsistent numerical fields.

These checks can help reveal records that require additional attention. Missing values are treated as unknown information rather than automatically assumed to be zero.

### 4.3 Turnout Analysis

ResultLens NG examines voter turnout using the relationship between accredited voters and registered voters.

**Turnout formula:**

$$
\text{Turnout (\%)} =
\frac{\text{Accredited Voters}}{\text{Registered Voters}}
\times 100
$$

Turnout analysis helps reviewers understand participation patterns and identify polling units whose values differ substantially from comparable units.

For example, a polling unit with unusually high turnout relative to other units in the same ward may warrant examination of the underlying figures and source documents.

High or low turnout alone does not establish an irregularity. The context, data quality, and supporting evidence must also be considered.

### 4.4 Explainable Anomaly Detection

ResultLens NG is designed to explain why a record has been flagged rather than presenting an unexplained score.

Possible reasons include:

* Accredited voters exceed registered voters.
* Valid votes exceed accredited voters.
* Ballot totals do not reconcile.
* Required data is missing.
* Turnout differs substantially from the relevant comparison group.
* Figures in a source result sheet differ from the corresponding structured record.

Where several signals are available, reviewers can examine them together to understand the nature of the discrepancy.

A flagged record means **verification is required**, not that fraud or misconduct has been proven.

### 4.5 Evidence Tracing

Evidence traceability is central to ResultLens NG.

The trace workflow is intended to connect a polling-unit record with its available supporting information, such as the source URL, result-sheet reference, recorded figures, validation findings, and review outcome.

The current deployed trace page is available here:

**[Open the ResultLens NG Ekiti 2026 Trace Page](https://civiclens-matthew-falades-projects.vercel.app/trace?id=ekiti-gov-2026-ec8a-0003)**

The page provides an entry point for examining a specific record. The existence of a trace page should not be confused with independent verification of every underlying source or automated extraction of every result-sheet figure.

### 4.6 Structured Review Workflow

A review queue can organise flagged records by issue type, location, relevant figures, and verification status.

This helps reviewers identify which records need attention and document their findings consistently.

Where priority labels or scores are used, they serve as technical aids for organising reviews. They are not ratings of candidates, parties, or election legitimacy.

### 4.7 Result-Sheet Comparison

An important development direction is comparing figures in structured datasets with those recorded on original polling-unit result sheets.

Where the relevant documents and structured records are available, such comparisons can help identify differences that require examination.

The process must account for missing documents, image quality, OCR errors, differences in field definitions, and inconsistent identifiers.

A discrepancy should be documented with the relevant figures and source references before any conclusion is drawn.

## 5. How ResultLens NG Works

The verification workflow is organised into several layers.

### Layer 1: Data Preparation

Election records are organised at polling-unit level. Aggregate or summary rows are separated from individual polling-unit records to avoid double-counting.

Required fields are examined, numeric values are converted into suitable formats, and missing information is identified.

### Layer 2: Arithmetic Validation

The system applies validation rules to examine relationships between registered voters, accredited voters, valid votes, rejected ballots, spoiled ballot papers, and ballot-paper totals.

### Layer 3: Turnout and Contextual Analysis

Turnout is calculated and compared across relevant groups, including polling units within the same ward or LGA.

Statistical methods can identify values that differ substantially from their comparison groups. Such results must be interpreted in context and should not be treated as evidence of wrongdoing by themselves.

### Layer 4: Explainable Findings

When a check identifies an issue, the system should present a clear explanation, including the relevant figures and the validation rule or comparison that triggered the flag.

### Layer 5: Evidence Examination

The reviewer examines the original result sheet or other relevant source material, where available, to determine whether the issue can be explained.

### Layer 6: Traceable Review

The intended output is a structured record containing the polling-unit identifier, observed issue, supporting figures, source reference, and human review outcome.

### High-Level Workflow

```text
Election Data and Source Documents
                |
                v
         Data Preparation
                |
                v
      Polling-Unit Records
                |
                v
       Arithmetic Validation
                |
                v
     Turnout and Context Analysis
                |
                v
      Explainable Review Flags
                |
                v
         Evidence Tracing
                |
                v
        Human Verification
```

## 6. Technology Stack

ResultLens NG combines AI-assisted web application development, web deployment, and Python-based data analysis.

| Technology                                  | Purpose                                                                          |
| ------------------------------------------- | -------------------------------------------------------------------------------- |
| Lovable                                     | Used to build and develop the web application interface.                         |
| Python                                      | Supports election-data processing, analytical workflows, and verification logic. |
| Pandas                                      | Supports data cleaning, grouping, aggregation, and polling-unit analysis.        |
| NumPy                                       | Supports numerical calculations, turnout calculations, and rule-based checks.    |
| Microsoft Excel / Excel-compatible datasets | Supports the handling and analysis of structured election data.                  |
| Vercel                                      | Hosts the deployed web application.                                              |

### How the Technologies Fit Together

Lovable supports development of the user-facing application, while Vercel hosts the deployed interface. Python, Pandas, and NumPy support the analytical workflow used to process and examine election data.

The project combines these components toward a common objective: making polling-unit records easier to examine and potential discrepancies easier to explain.

The precise integration between the web application and Python analysis depends on the current implementation. Components should only be described as connected through an automated backend when that integration exists in the codebase.

## 7. Data Sources and Scope

The initial project scope focuses on polling-unit-level election data associated with the 2026 Ekiti State governorship election.

Potential data sources include:

* The Independent National Electoral Commission (INEC) result-viewing portal, IReV, for published polling-unit result sheets.
* Structured election-result datasets containing polling-unit identifiers and numerical figures.
* Officially published results and collation records, where available and comparable.
* Supporting documentation describing data origin, coverage, collection methods, and limitations.

Each dataset should be documented with its source, collection date where relevant, geographic coverage, electoral context, and known limitations.

**A comparison is meaningful only when the records refer to the same election, polling unit, and compatible result fields.**

Differences in polling-unit identifiers, reporting stages, aggregation levels, or field definitions must be resolved or explicitly documented.

A missing online result sheet does not establish that voting did not occur. Likewise, an unavailable image or an unusual numerical value does not automatically establish an irregularity.

## 8. Example Verification Scenario

Consider the following hypothetical polling-unit record:

| Field                    | Example value |
| ------------------------ | ------------: |
| Registered voters        |           500 |
| Accredited voters        |           240 |
| Total valid votes        |           235 |
| Rejected ballots         |             5 |
| Total used ballot papers |           240 |

The turnout is:

240 ÷ 500 × 100 = 48%

The valid-vote total and rejected ballots add up to 240, matching the recorded total used ballot papers.

These specific checks are internally consistent based on the fields shown.

Now suppose the same record reported 260 valid votes. The system would flag that relationship for review because the valid-vote total exceeds the accredited-voter count.

The reviewer would then examine the figures and source evidence to determine whether the discrepancy resulted from a data-entry error, an extraction issue, a record mismatch, or another explanation.

**The flag identifies an issue for investigation; it does not independently prove electoral misconduct.**

*This example is illustrative and does not represent an actual polling-unit finding.*

## 9. Responsible Use and Political Neutrality

ResultLens NG is intended to support transparent, evidence-based examination of election records. It is not designed to promote or oppose any candidate, political party, or electoral outcome.

The project follows these principles:

* **Political neutrality:** Apply the same verification rules regardless of party or candidate.
* **Explainability:** Provide a clear reason for each flag.
* **Traceability:** Connect findings to the relevant record and available supporting evidence.
* **Human oversight:** Require examination before drawing conclusions about unresolved issues.
* **Data integrity:** Preserve original values and distinguish missing information from zero.
* **Privacy:** Avoid collecting or exposing personal voter information that is not necessary for polling-unit-level verification.
* **Transparency:** Document assumptions, limitations, incomplete data, and unavailable sources.
* **Responsible interpretation:** Treat anomalies as signals requiring investigation rather than automatic evidence of misconduct.

ResultLens NG focuses on aggregated polling-unit information and published election records. Its core purpose does not require identifying individual voters.

## 10. Current Development Status

ResultLens NG is being developed as a project for the Young Data Professionals 2026 Datathon.

The project has a deployed polling-unit trace page and a Python-based election-data analysis workflow. The analytical work includes data preparation, turnout calculations, arithmetic validation, and contextual comparisons.

The following capabilities are development goals and should be marked as completed only after implementation and testing:

* Automated IReV result-sheet collection.
* Optical character recognition (OCR) for extracting figures from scanned documents.
* Automated comparison between extracted figures and structured election records.
* Complete evidence provenance and review-history logging.
* Interactive geographic visualisation.
* Automated monitoring of missing or delayed result-sheet uploads.
* Production-grade authentication, access controls, and monitoring.

This section should be updated as these capabilities become operational and are validated.

## 11. Future Roadmap

### Phase 1: Core Verification

* Refine polling-unit data cleaning.
* Improve missing-value and invalid-value handling.
* Strengthen arithmetic validation.
* Improve turnout and contextual comparisons.
* Provide clearer explanations for flagged records.

### Phase 2: Evidence Integration

* Collect and catalogue available result sheets.
* Explore OCR for extracting figures from result-sheet images.
* Compare extracted figures with structured records.
* Record source references and extraction limitations.

### Phase 3: Review and Visualisation

* Improve polling-unit search and traceability.
* Develop a structured review queue.
* Add geographic comparisons where reliable location identifiers exist.
* Support evidence-linked review reports.

### Phase 4: Testing and Reliability

* Test verification rules against manually reviewed examples.
* Evaluate extraction accuracy if OCR is implemented.
* Measure false-positive and missed-discrepancy rates.
* Improve error handling, documentation, and reproducibility.
* Strengthen security, privacy, and data-source monitoring.

## 12. Limitations

ResultLens NG is a decision-support tool, not an official election authority or a substitute for legally established election review procedures.

Its findings depend on the completeness, accuracy, and comparability of the available data.

A missing result sheet, unusual turnout value, or arithmetic inconsistency may have several explanations. Statistical methods cannot independently establish intent or prove electoral misconduct.

The system should distinguish between:

1. A potential anomaly identified by a rule or statistical comparison.
2. A discrepancy confirmed through examination of the underlying figures.
3. A conclusion supported by additional evidence and appropriate review.

This distinction is central to responsible election verification.

## 13. Getting Started

### Explore the Deployed Application

Visit the current ResultLens NG trace page:

https://civiclens-matthew-falades-projects.vercel.app/trace?id=ekiti-gov-2026-ec8a-0003

### Clone the Repository

Replace the placeholders below with the actual GitHub repository URL and directory name:

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd YOUR_REPOSITORY_NAME
```

### Python Analysis Environment

If the repository includes a Python analysis workflow, create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

Or on macOS/Linux:

```bash
source .venv/bin/activate
```

If the repository contains a `requirements.txt` file, install the dependencies:

```bash
pip install -r requirements.txt
```

### Web Application

Follow the installation and development instructions for the actual frontend files and package manager included in the repository.

Because the web application and Python analysis workflow may be separate components, their local setup instructions should be documented independently unless they have been integrated into a single application.

**Security note:** Never commit API keys, access tokens, credentials, or private datasets to a public repository.

## 14. Project Demo

**Live application:**
[Open ResultLens NG](https://civiclens-matthew-falades-projects.vercel.app/trace?id=ekiti-gov-2026-ec8a-0003)

The demo illustrates the project's approach to polling-unit record traceability and evidence-based review.

For an effective demonstration, reviewers should be able to see a polling-unit record, inspect the relevant figures, understand any validation flags, and identify supporting source material where available.

## 15. Team

**Team CivicLens**

* **Matthew Falade**
* **Gabriel Olaogun**

**Project:** ResultLens NG
**Event:** Young Data Professionals 2026 Datathon
**Track:** Politics and Governance

## 16. Contributions and Feedback

We welcome constructive feedback on data quality, validation rules, explainability, evidence traceability, accessibility, and responsible election-data analysis.

Potential contributions include:

* Testing arithmetic validation rules.
* Improving data cleaning and missing-value handling.
* Identifying edge cases in polling-unit datasets.
* Evaluating document extraction methods.
* Improving evidence presentation and review workflows.
* Reviewing security, privacy, and reproducibility.

Contributions should preserve political neutrality, document assumptions, and avoid unsupported claims about candidates, parties, or electoral outcomes.

## 17. Acknowledgements

We recognise the public-interest value of transparent election information and the importance of making published records easier to examine responsibly.

ResultLens NG is developed by Team CivicLens for the Politics and Governance track of the Young Data Professionals 2026 Datathon.

---

## ResultLens NG

### Evidence. Transparency. Accountability.

Our goal is to help people move from election data to explainable, traceable verification, one polling unit at a time.
