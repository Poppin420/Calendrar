/**
 * English messages. The Greek file must have exactly the same shape
 * (enforced by the `Messages` type). Placeholders use {curly} braces.
 */
export const en = {
  meta: {
    title: 'Fairness Audit Playground',
    description:
      'Check whether a set of decisions treats any group unfairly. Free, private, in your browser.',
  },
  app: {
    name: 'Fairness Audit',
    nameAccent: 'Playground',
    tagline: 'Check your decisions for unfair treatment, without your data leaving your computer.',
  },
  nav: {
    audit: 'Audit',
    methodology: 'Methodology',
    about: 'About',
    skip: 'Skip to main content',
    language: 'Language',
    themeToLight: 'Switch to light theme',
    themeToDark: 'Switch to dark theme',
    menu: 'Main menu',
  },
  privacy: {
    badge: 'Your data never leaves this browser',
    footer:
      'Everything is computed on your device. No uploads, no cookies, no analytics. Close the tab and the data is gone.',
    landingTitle: 'Private by design',
    landingBody:
      'Your file is read and analysed entirely inside this browser tab. Nothing is uploaded, stored or tracked: there is no server and no analytics. You can even disconnect from the internet after the page loads.',
  },
  landing: {
    eyebrow: 'Free fairness check for decision data',
    title: 'Is anyone treated unfairly by your decisions?',
    lead: 'Upload a spreadsheet of past decisions, such as hiring, loan approvals or grants, and see whether some groups (for example women, older applicants, or people of a certain background) get the favorable outcome less often than others. Every number comes with an honest measure of uncertainty and a plain-language explanation, so you can tell a real warning sign from noise.',
    tryDemo: 'Try a demo dataset',
    upload: 'Upload your CSV',
    howTitle: 'How it works',
    step1Title: 'Upload',
    step1Body: 'A CSV file with one row per person or case. Excel can save as CSV.',
    step2Title: 'Map columns',
    step2Body: 'Tell us which column holds the decision and which describe the groups to compare.',
    step3Title: 'Read the results',
    step3Body:
      'Clear verdicts with confidence intervals, a downloadable PDF report, and optional deeper analysis.',
    whoTitle: 'Made for',
    whoBody:
      'Small businesses, NGOs, HR teams, public bodies and students. No statistics background needed.',
  },
  steps: {
    label: 'Audit progress',
    upload: 'Data',
    mapping: 'Columns',
    results: 'Results',
  },
  demo: {
    title: 'Demo datasets',
    intro:
      'Two classic public datasets used in fairness research. Pick one to see the whole tool in action.',
    load: 'Load this demo',
    source: 'Source',
    rows: '{n} rows',
    lookFor: 'What to look for',
    adultName: 'Adult Income (US Census 1994)',
    adultDescription:
      'People from the 1994 US Census, with whether they earn more than $50K a year. We added a “model_decision” column: the prediction of a simple model that never saw sex, race or age. A random sample of 12,000 of the 48,842 rows.',
    adultLook1:
      'Women get the favorable outcome (>50K) far less often than men, both in reality and in the model’s decisions.',
    adultLook2:
      'The model never saw “sex”, yet it reproduces the gap. Open “Dig deeper” to see which columns act as proxies (hint: “relationship” contains Husband / Wife).',
    adultLook3: 'Look at the sex × age heatmap: young women are the group with the lowest rate.',
    germanName: 'German Credit (Statlog)',
    germanDescription:
      '1,000 loan applicants from a German bank, rated as good or bad credit risks. We decoded the original codes into readable labels and added a “model_decision” column (approve / reject) from a simple model that never saw sex, age or marital status.',
    germanLook1:
      'Applicants younger than 25 are approved less often. Is the gap clear or within the noise?',
    germanLook2:
      'With only 1,000 rows, some intersectional groups are small. Notice when the tool says “inconclusive” instead of raising an alarm.',
    germanLook3:
      'In the original data “sex” and “marital status” were one combined column, so marital status is a near-perfect proxy for sex.',
  },
  upload: {
    title: 'Upload your data',
    intro:
      'A CSV file with a header row and one row per decision. Up to about 100,000 rows works smoothly.',
    dropTitle: 'Drag and drop a CSV file here',
    dropOr: 'or',
    browse: 'Choose a file',
    dropHint: 'Comma, semicolon or tab separated. UTF-8 recommended.',
    dropActive: 'Drop the file to analyse it',
    reading: 'Reading {name}…',
    loaded: '{name}: {rows} rows, {cols} columns',
    previewTitle: 'Preview',
    previewCaption: 'First rows of {name}',
    columnsTitle: 'Detected columns',
    qualityTitle: 'Data quality checks',
    qualityNone: 'No obvious data problems found.',
    continue: 'Continue to column mapping',
    another: 'Use a different file',
    missingShort: '{n} missing',
    uniqueShort: '{n} distinct',
    range: '{min} to {max}',
  },
  kinds: {
    numeric: 'Number',
    binary: 'Two values',
    categorical: 'Categories',
    identifier: 'ID / free text',
    constant: 'Single value',
  },
  warnings: {
    missingValues:
      '“{column}” has missing values in {value}% of rows. Rows missing a value in a column you map will be left out.',
    constantColumn: '“{column}” has the same value in every row, so it cannot tell groups apart.',
    identifierColumn:
      '“{column}” looks like an ID or free text (almost every value is different). It will be ignored in modelling.',
    tinyGroup:
      '“{column}” has {value} group(s) with fewer than 30 rows ({detail}). Results for them will be shown but not used for conclusions.',
    fewRows: 'The file has only {value} rows. Results will be very uncertain.',
    raggedRows:
      '{value} row(s) have a different number of fields than the header. Check the file’s separator and quotes.',
  },
  mapping: {
    title: 'Tell us about your columns',
    intro: 'We pre-filled our best guesses. Check them, then run the audit.',
    decisionTitle: '1. The decision',
    decisionHelp:
      'The column with the outcome you want to check, e.g. “hired”, “approved”, “loan_granted”.',
    decisionLabel: 'Decision column',
    favorableLabel: 'Which value(s) mean a favorable outcome?',
    favorableHelp:
      'Select the values that are good for the person (e.g. “yes”, “approved”). All other values count as unfavorable.',
    sensitiveTitle: '2. Groups to compare',
    sensitiveHelp:
      'Columns describing personal characteristics such as sex, age or nationality. Choose one, or two to also see their combinations (e.g. women under 25).',
    sensitiveLabel: 'Sensitive attribute {n}',
    sensitiveNone: 'Not used',
    addSecond: 'Add a second attribute',
    removeSecond: 'Remove',
    binsTitle: 'Number ranges',
    binsHelp: 'Numbers are grouped into ranges. Edit the cut-off points, separated by commas.',
    binsLabel: 'Cut-off points for “{column}”',
    binsInvalid: 'Enter numbers separated by commas, e.g. 25, 40, 60.',
    groupsPreview: 'Groups and their sizes',
    groupSmall: 'fewer than 30 rows',
    truthTitle: '3. Actual outcomes (optional)',
    truthHelp:
      'If the decisions came from a model or a screening rule, and you also know what actually happened (did the person perform well, did the loan get repaid?), choose that column. This unlocks error-based metrics.',
    truthLabel: 'Actual outcome column',
    truthNone: 'I don’t have this',
    truthFavorableLabel: 'Which value(s) mean the actual outcome was good?',
    run: 'Run the audit',
    back: 'Back',
    errNoDecision: 'Choose a decision column.',
    errNoFavorable: 'Select at least one favorable value.',
    errAllFavorable:
      'If every value is favorable there is nothing to compare. Leave at least one value unselected.',
    errNoSensitive: 'Choose at least one sensitive attribute.',
    errSameColumn:
      'The decision, actual outcome and sensitive attributes must be different columns.',
    errTruthFavorable: 'Select at least one favorable value for the actual outcome.',
    loadingGroups: 'Counting groups…',
  },
  verdict: {
    ok: 'Within threshold',
    concern: 'Possible problem',
    inconclusive: 'Inconclusive',
    insufficient: 'Not enough data',
    na: 'Not applicable',
  },
  metricNames: {
    disparateImpact: 'Disparate impact (80% rule)',
    demographicParity: 'Demographic parity',
    equalOpportunity: 'Equal opportunity',
    equalizedOdds: 'Equalized odds',
    predictiveParity: 'Predictive parity',
    accuracyParity: 'Accuracy by group',
  },
  metricQuestions: {
    disparateImpact:
      'Does each group get the favorable outcome at least 80% as often as the best-treated group?',
    demographicParity: 'How far apart are the groups’ rates of favorable outcomes?',
    equalOpportunity:
      'Among people who deserved it, does every group get the favorable decision equally often?',
    equalizedOdds: 'Are both kinds of mistakes spread evenly across groups?',
    predictiveParity: 'When the decision is favorable, is it equally often right for every group?',
    accuracyParity: 'Are decisions equally often correct for every group?',
  },
  sentences: {
    disparateImpact:
      'Group “{worst}” gets the favorable outcome {ratio} as often as group “{best}” ({worstRate} vs {bestRate}).',
    demographicParity:
      'Favorable outcomes range from {worstRate} for “{worst}” to {bestRate} for “{best}”, a gap of {gap} percentage points.',
    equalOpportunity:
      'Among people whose actual outcome was good, “{worst}” got the favorable decision {worstRate} of the time vs {bestRate} for “{best}” (gap: {gap} points).',
    equalizedOddsTpr:
      'The largest gap is in correctly approving deserving cases: {worstRate} for “{worst}” vs {bestRate} for “{best}” (gap: {gap} points).',
    equalizedOddsFpr:
      'The largest gap is in approving cases that turned out badly: {worstRate} for “{worst}” vs {bestRate} for “{best}” (gap: {gap} points).',
    predictiveParity:
      'When the decision was favorable, it proved right {worstRate} of the time for “{worst}” vs {bestRate} for “{best}” (gap: {gap} points).',
    accuracyParity:
      'Decisions were correct {worstRate} of the time for “{worst}” vs {bestRate} for “{best}” (gap: {gap} points).',
    ratioOk: 'That is at or above the 80% threshold.',
    ratioConcern:
      'That is below the 80% threshold, which may indicate a problem worth investigating.',
    ratioInconclusive:
      'That is below the 80% threshold, but the groups’ confidence intervals overlap too much to be sure the gap is real.',
    gapOk: 'The gap is within the 10-point tolerance.',
    gapConcern: 'The gap is larger than 10 points and too large to be explained by chance.',
    gapInconclusive:
      'The gap is larger than 10 points, but with this much uncertainty it could be chance.',
    insufficient:
      'At least one group has fewer than 30 relevant rows, so we show the numbers but do not draw a conclusion.',
    na: 'This metric cannot be computed for this data (for example, no group received the favorable outcome, or no group had a good actual outcome).',
    intervalRatio: '95% interval for the ratio: {lo} to {hi}.',
    intervalGap: '95% interval for the gap: {lo} to {hi} points.',
  },
  dashboard: {
    title: 'Audit results',
    summaryRows: '{n} rows analysed',
    summaryDropped: '{n} rows left out because of missing values',
    summaryOverall: 'Overall favorable rate: {rate}',
    summaryFavorable: 'Favorable outcome: {values} in “{column}”',
    summaryTruth: 'Actual outcome: {values} in “{column}”',
    noTruth: 'No actual-outcome column, so error-based metrics are not shown.',
    attributeTabs: 'Choose which grouping to view',
    headline: 'At a glance',
    headlineConcern: '{n} possible problem(s) found',
    headlineInconclusive: '{n} inconclusive result(s)',
    headlineOk: 'No clear problems found for the metrics shown',
    ratesTitle: 'Favorable outcome rate by group',
    ratesCaption:
      'Bars show the share of each group with a favorable outcome; whiskers show the 95% confidence interval. The dashed line marks 80% of the highest rate.',
    fourFifthsLine: '80% of highest',
    tableTitle: 'Numbers by group',
    tableCaption: 'All rates with 95% Wilson confidence intervals.',
    colGroup: 'Group',
    colN: 'Rows',
    colRate: 'Favorable rate',
    colTpr: 'True positive rate',
    colFpr: 'False positive rate',
    colPrecision: 'Precision',
    colAccuracy: 'Accuracy',
    smallGroup: 'Small group: fewer than 30 rows',
    metricsTitle: 'Fairness metrics',
    heatmapTitle: 'Combined groups: {a} × {b}',
    heatmapCaption:
      'Each cell shows the favorable outcome rate for people in both groups. Darker means a higher rate. Cells with fewer than 30 rows are striped and marked with ⚠.',
    heatmapEmpty: 'no rows',
    heatmapLegendLow: 'lower rate',
    heatmapLegendHigh: 'higher rate',
    conflictTitle: 'Before you draw conclusions',
    conflictBody1:
      'Fairness metrics measure different things and can conflict: when groups have different base rates, it is mathematically impossible to satisfy all of them at once. Decide which one matters most for your situation.',
    conflictBody2:
      'A flag is a reason to look closer, not a legal verdict. Differences can have legitimate explanations, and the absence of a flag does not prove a process is fair.',
    singleClass:
      'Every row has the same decision, so there is nothing to compare. Check that you chose the right favorable value.',
    exportPdf: 'Download PDF report',
    exportHint: 'Opens your browser’s print dialog. Choose “Save as PDF”.',
    restart: 'Start over',
    editMapping: 'Change columns',
    computing: 'Computing metrics…',
    show: 'Show details',
    hide: 'Hide details',
    lowest: 'Lowest',
    highest: 'Highest',
    groupsExcluded: 'Groups with fewer than 30 rows are not used for the verdict: {groups}.',
  },
  deeper: {
    title: 'Dig deeper: where does bias come from?',
    intro:
      'We train a simple model (regularised logistic regression) on your data without the sensitive attribute, then check which other columns secretly carry information about it. These “proxies” are how bias leaks into decisions even when the sensitive column is removed.',
    attributeLabel: 'Analyse groups by',
    run: 'Run deeper analysis',
    rerun: 'Run again',
    running: 'Training models in the background…',
    stage_prepare: 'Preparing data',
    stage_encode: 'Encoding columns',
    stage_train: 'Training the model',
    stage_reweigh: 'Training the reweighed model',
    stage_proxies: 'Looking for proxies',
    stage_done: 'Done',
    targetDecision: 'The model learns to reproduce the decisions in “{column}”.',
    targetTruth: 'The model learns to predict the actual outcome in “{column}”.',
    split: 'Trained on {train} rows, evaluated on {test} held-out rows, {features} columns used.',
    dropped: 'Ignored columns (IDs, free text or constant): {columns}.',
    proxyTitle: 'Possible proxies',
    proxyCaption:
      'Right: the column is strongly linked to “{attribute}”. Up: the model relies on it heavily. Columns in the top-right corner are likely proxies.',
    proxyAxisX: 'Link to the sensitive attribute (Cramér’s V)',
    proxyAxisY: 'Importance for the model (accuracy drop)',
    proxyNone:
      'No column is both strongly linked to the sensitive attribute and important for the model.',
    proxyFound:
      'Likely proxies: {columns}. The model can partly “guess” the sensitive attribute through them.',
    colFeature: 'Column',
    colAssociation: 'Cramér’s V',
    colMI: 'Information share',
    colImportance: 'Importance',
    colCoefficient: 'Std. coefficient',
    proxyTag: 'Likely proxy',
    mitigationTitle: 'Simple mitigation: reweighing',
    mitigationIntro:
      'Reweighing (Kamiran & Calders) gives more weight during training to under-represented combinations, such as favorable outcomes for a disadvantaged group, so the model learns from data where group and outcome are independent. The data itself is not changed.',
    before: 'Original model',
    after: 'Reweighed model',
    metric: 'Measure',
    accuracy: 'Accuracy',
    diRatio: 'Disparate impact ratio (higher is fairer, 1 = equal)',
    dpGap: 'Demographic parity gap (lower is fairer)',
    eoGap: 'Equal opportunity gap (lower is fairer)',
    tradeoff:
      'Trade-off: disparate impact moved from {before} to {after}, while accuracy changed by {accDelta} percentage points.',
    tradeoffNote:
      'Mitigation is a trade-off, not a fix. A more balanced model may be slightly less accurate on historical data, which itself may reflect past bias.',
    weightsTitle: 'Training weights used',
    weightGroup: 'Group',
    weightLabel: 'Outcome',
    weightValue: 'Weight',
    favorable: 'favorable',
    unfavorable: 'unfavorable',
    ratesChartTitle: 'Model’s favorable rate by group, before and after',
    errNoFeatures:
      'There are no usable columns left to train a model after removing the decision and sensitive columns.',
    errSingleClass: 'All rows have the same outcome, so a model cannot be trained.',
    errTooFewRows: 'At least 50 complete rows are needed to train a model.',
  },
  report: {
    title: 'Fairness audit report',
    generated: 'Generated on {date}',
    privacy:
      'Prepared with Fairness Audit Playground. The data was analysed locally and never left the author’s computer.',
    summaryTitle: '1. Dataset',
    file: 'File',
    rows: 'Rows analysed',
    dropped: 'Rows left out (missing values)',
    overall: 'Overall favorable rate',
    mappingTitle: '2. What was checked',
    decision: 'Decision',
    favorable: 'Favorable value(s)',
    sensitive: 'Groups compared',
    truth: 'Actual outcome',
    none: 'not provided',
    findingsTitle: '3. Key findings',
    metricsTitle: '4. Metrics in detail',
    groupsTitle: 'Rates by group',
    intersectionalTitle: '5. Combined groups',
    deeperTitle: '6. Deeper analysis',
    limitationsTitle: 'Limitations',
    limitation1:
      'Results describe the data supplied, not the process that produced it. Missing or mislabelled data can change them.',
    limitation2:
      'Groups with fewer than 30 rows are shown but not used for conclusions. Confidence intervals are 95% intervals; about 1 in 20 can miss the true value.',
    limitation3:
      'Fairness metrics can conflict; satisfying one may violate another. Thresholds (80%, 10 points) are conventions, not legal limits.',
    limitation4:
      'A flag is a reason to investigate, not proof of discrimination, and no flag is not proof of fairness. Seek legal advice for decisions with legal effect.',
    readingGuide:
      'How to read this report: “Possible problem” means the gap exceeds the threshold and is statistically clear. “Inconclusive” means the gap exceeds the threshold but could be chance. “Not enough data” means a group is too small.',
    page: 'Fairness Audit Playground',
    valueCol: 'Gap / ratio',
    verdictCol: 'Verdict',
  },
  errors: {
    title: 'Something went wrong',
    empty: 'The file is empty.',
    noHeader: 'The file needs a header row and at least one data row.',
    oneColumn:
      'We found only one column. The file may use a separator we did not recognise. Try saving it again as CSV (comma separated).',
    tooLarge: 'The file has more than 200,000 rows. Please use a sample.',
    malformed:
      'The file does not look like a valid CSV: most rows have a different number of fields than the header.',
    notCsv: 'Please choose a .csv or .txt file.',
    read: 'We could not read the file.',
    worker: 'The analysis failed unexpectedly: {message}',
    demo: 'The demo file could not be loaded.',
    tryAgain: 'Try again',
  },
  common: {
    yes: 'Yes',
    no: 'No',
    close: 'Close',
    loading: 'Loading…',
    ci: '95% CI',
    of: 'of',
    and: 'and',
    points: 'points',
    learnMore: 'How is this calculated?',
  },
  methodology: {
    title: 'Methodology',
    lead: 'How every number in this tool is computed, which assumptions it relies on, and where it can mislead. All calculations are implemented from scratch in open TypeScript code and unit-tested.',
    setupTitle: 'Setup and notation',
    setupBody:
      'Each row is one decision. Ŷ = 1 when the decision was favorable, Y = 1 when the actual outcome was good (only if you provide it), and A is the group (e.g. sex). Rows missing any of these values are left out. Numeric attributes such as age are grouped into the ranges you choose.',
    selectionTitle: 'Selection (favorable) rate',
    selectionBody: 'The share of a group that received the favorable decision.',
    diTitle: 'Disparate impact and the four-fifths rule',
    diBody:
      'The lowest group selection rate divided by the highest. The US Equal Employment Opportunity Commission’s Uniform Guidelines (1978) treat a ratio below 0.8 as evidence of adverse impact: the “four-fifths rule”. It is a rule of thumb used in practice, not a test of statistical significance, which is why we add confidence intervals.',
    dpTitle: 'Demographic parity',
    dpBody:
      'The difference between the highest and lowest selection rate. 0 means all groups receive favorable outcomes equally often. We flag gaps above 10 percentage points.',
    eoTitle: 'Equal opportunity',
    eoBody:
      'Hardt, Price & Srebro (2016). Among people who actually had a good outcome, the share that received the favorable decision (true positive rate) should be equal across groups.',
    eodTitle: 'Equalized odds',
    eodBody:
      'Both the true positive rate and the false positive rate should be equal across groups. We report the larger of the two gaps.',
    ppTitle: 'Predictive parity',
    ppBody:
      'Chouldechova (2017). Among favorable decisions, the share that turned out right (precision) should be equal across groups.',
    accTitle: 'Accuracy by group',
    accBody: 'The share of correct decisions in each group.',
    ciTitle: 'Uncertainty: confidence intervals',
    ciBody:
      'Each rate has a 95% Wilson score interval, which stays reliable for small groups and for rates near 0% or 100%, unlike the simple “±1.96·SE” interval. Gaps between two groups get a Newcombe interval, built from the two Wilson intervals; ratios get a Katz log interval.',
    verdictTitle: 'From numbers to verdicts',
    verdictBody:
      'For each metric we compare the group with the lowest rate to the group with the highest rate, using only groups with at least 30 rows in the metric’s denominator.',
    verdictOk: 'Within threshold: ratio ≥ 0.8, or gap ≤ 10 points.',
    verdictConcern:
      'Possible problem: beyond the threshold, and the 95% interval of the gap excludes zero.',
    verdictInconclusive:
      'Inconclusive: beyond the threshold, but the interval of the gap includes zero: the groups’ intervals overlap too much to tell the difference from chance.',
    verdictInsufficient: 'Not enough data: fewer than two groups have 30 or more rows.',
    intersectionalTitle: 'Intersectional analysis',
    intersectionalBody:
      'Bias can hide in combinations: a process can treat women and young people reasonably on their own, yet treat young women badly. With two attributes we show every combination as a heatmap and compute all metrics on the combined groups. Combined groups are smaller, so expect more “not enough data”.',
    deeperTitle: 'Dig deeper: proxies and mitigation',
    deeperBody1:
      'We train an L2-regularised logistic regression (λ = 0.001, mini-batch Adam, 70/30 stratified split, seeded so results are reproducible) on every column except the decision, the actual outcome and the sensitive attributes. Numeric columns are standardised; categorical ones are one-hot encoded (up to 15 categories). If you provided an actual outcome, the model predicts it; otherwise it learns to reproduce the decisions.',
    deeperBody2:
      'Proxy detection combines two views. Association: Cramér’s V between each column (numbers cut into quintiles) and the sensitive groups, plus the share of the groups’ entropy it explains (normalised mutual information). Reliance: permutation importance, the drop in held-out accuracy when the column is shuffled. A column is flagged as a likely proxy when V ≥ 0.25 and it is among the model’s five most important columns.',
    deeperBody3:
      'Reweighing (Kamiran & Calders, 2012) gives each training row the weight w(a, y) = P(A = a)·P(Y = y) / P(A = a, Y = y), making group and outcome independent in the weighted data. We retrain with these weights and compare fairness and accuracy on the same held-out rows.',
    limitsTitle: 'Assumptions and limitations',
    limit1:
      'Group metrics say nothing about individual cases, and they only cover the attributes you include.',
    limit2:
      'When base rates differ between groups, demographic parity, equalized odds and predictive parity cannot all hold at once (Kleinberg et al., 2016; Chouldechova, 2017). Choosing a metric is a value judgement.',
    limit3:
      'Error-based metrics treat the “actual outcome” as truth. If it was itself shaped by biased decisions (for example, only approved applicants could prove they repay), these metrics inherit that bias.',
    limit4:
      'Each metric is tested on its own at the 95% level. Checking many metrics and groups increases the chance of a false alarm.',
    limit5:
      'The thresholds (80%, 10 points, 30 rows, V ≥ 0.25) are widely used conventions, not legal standards.',
    limit6:
      'The logistic regression is deliberately simple. It shows how bias can leak through proxies; it is not a model to deploy.',
    legalTitle: 'Legal context',
    legalBody1:
      'EU AI Act (Regulation (EU) 2024/1689): AI systems used in employment, access to credit, education and essential services are classified as high-risk (Annex III). Providers must use training data that is examined for possible biases (Article 10) and keep risk management and human oversight in place.',
    legalBody2:
      'EU equality directives (2000/43/EC, 2000/78/EC, 2006/54/EC) prohibit direct and indirect discrimination; statistics showing a group is disproportionately disadvantaged can be evidence of indirect discrimination. GDPR applies to the personal data in your file.',
    legalBody3:
      'This tool does not give legal advice. A flag is a reason to investigate, not a legal finding.',
    referencesTitle: 'References',
  },
  about: {
    title: 'About this project',
    lead: 'Fairness Audit Playground is a free, open-source tool that makes basic algorithmic fairness checks accessible to people without a data science team.',
    motivationTitle: 'Why I built it',
    motivation1:
      'Fairness toolkits such as Fairlearn and AIF360 are excellent, but they need Python and a statistics background. Meanwhile the people who make or review everyday decisions (a small company hiring, an NGO allocating grants, an HR officer reviewing promotions) usually have a spreadsheet and a few questions.',
    motivation2:
      'This project brings those checks into the browser with honest uncertainty, plain language in Greek and English, and a strict privacy model: the data never leaves your computer.',
    authorTitle: 'Author',
    authorName: 'Your Name',
    authorRole: 'MSc Artificial Intelligence (Data Analytics) · BSc',
    authorBio:
      'Interested in trustworthy machine learning, data analytics and tools that make AI accountable to the people it affects.',
    github: 'GitHub',
    linkedin: 'LinkedIn',
    stackTitle: 'How it is built',
    stackBody:
      'React, TypeScript and Vite; Papa Parse for CSV; Recharts for charts. All metrics, confidence intervals, the logistic regression and reweighing are implemented from scratch and unit-tested, and the heavy computation runs in a Web Worker. Hosted as a static site with a strict Content Security Policy that forbids network requests to other servers.',
    disclaimerTitle: 'Disclaimer',
    disclaimer: 'Educational tool. Results are not legal advice.',
  },
} as const;
