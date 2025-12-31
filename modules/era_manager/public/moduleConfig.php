    <?php
    /**
     * moduleConfig.php
     * ERA Manager — Styled Like VOIP.ms Module
     * Adds ERA SFTP config with X12 autofill and polished layout.
     */

    $sessionAllowWrite = true;
    require_once(__DIR__ . '/../../../../../interface/globals.php');

    use OpenEMR\Core\Header;

    $setting_keys = [
        'era_sftp_host'   => 'SFTP Host',
        'era_sftp_user'   => 'SFTP Username',
        'era_sftp_pass'   => 'SFTP Password',
        'era_remote_path' => 'Remote ERA Directory',
        'era_local_path'  => 'Local Storage Directory'
    ];

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        foreach ($setting_keys as $key => $label) {
            if (isset($_POST[$key])) {
                sqlStatement("REPLACE INTO globals (gl_name, gl_index, gl_value) VALUES (?, 0, ?)", [$key, trim($_POST[$key])]);
            }
        }
        header("Location: ?saved=1");
        exit;
    }

    $values = [];
    foreach ($setting_keys as $key => $label) {
        $row = sqlQuery("SELECT gl_value FROM globals WHERE gl_name = ?", [$key]);
        $values[$key] = htmlspecialchars($row['gl_value'] ?? '', ENT_QUOTES);
    }

    $x12_partners = sqlStatement("SELECT id, name, x12_sftp_host, x12_sftp_login, x12_sftp_remote_dir, x12_sftp_local_dir FROM x12_partners ORDER BY name");
    $partner_options = [];
    while ($row = sqlFetchArray($x12_partners)) {
        $partner_options[] = $row;
    }

    Header::setupHeader(['bootstrap']);
    ?>

<!DOCTYPE html>
<html>
<head>
    <title>ERA Manager Settings</title>
    <style>
        body {
            font-family: "Segoe UI", Tahoma, sans-serif;
            background-color: #f0f2f5;
            margin: 0;
            padding: 0;
        }
        .container-box {
            max-width: 1100px;
            background: #fff;
            margin: 40px auto;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .section-header {
            background: #f5f5f5;
            padding: 10px 15px;
            border-radius: 6px;
            font-weight: bold;
            margin-bottom: 10px;
            border: 1px solid #ccc;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            font-weight: 500;
        }
        input.form-control, select.form-control {
            width: 100%;
            padding: 6px 10px;
            font-size: 14px;
            border-radius: 6px;
            border: 1px solid #ccc;
        }
        .alert-success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 10px 15px;
            border-radius: 6px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
<div class="container-box">
    <h2 style="text-align: center;">🧾 ERA Manager Settings</h2>
    <hr>

    <?php if ($_GET['saved'] ?? '' === '1'): ?>
        <div class="alert-success">✅ Settings successfully saved.</div>
    <?php endif; ?>

    <form method="POST">
        <div class="form-group">
            <label for="x12_partner_select">📂 Import From X12 Partner</label>
            <select class="form-control" id="x12_partner_select">
                <option value="">-- Select X12 Partner --</option>
                <?php foreach ($partner_options as $partner): ?>
                    <option value="<?= $partner['id'] ?>"
                        data-host="<?= htmlspecialchars($partner['x12_sftp_host']) ?>"
                        data-user="<?= htmlspecialchars($partner['x12_sftp_login']) ?>"
                        data-remote="<?= htmlspecialchars($partner['x12_sftp_remote_dir']) ?>"
                        data-local="<?= htmlspecialchars($partner['x12_sftp_local_dir']) ?>">
                        <?= htmlspecialchars($partner['name']) ?>
                    </option>
                <?php endforeach; ?>
            </select>
        </div>

        <div class="section-header">🔧 SFTP Configuration</div>

        <?php foreach ($setting_keys as $key => $label): ?>
            <div class="form-group">
                <label for="<?= $key ?>"><?= $label ?></label>
                <input
                    type="<?= $key === 'era_sftp_pass' ? 'password' : 'text' ?>"
                    class="form-control"
                    name="<?= $key ?>"
                    id="<?= $key ?>"
                    value="<?= $values[$key] ?>">
            </div>
        <?php endforeach; ?>

        <div style="text-align: center; margin-top: 30px;">
            <button type="submit" class="btn btn-primary">💾 Save Settings</button>
        </div>
    </form>
</div>

<script>
    top.restoreSession && top.restoreSession();
    if (top.setTabTitle) top.setTabTitle("ERA Settings");

    document.getElementById("x12_partner_select").addEventListener("change", function () {
        const selected = this.options[this.selectedIndex];
        if (!selected.dataset.host) return;

        document.getElementById("era_sftp_host").value = selected.dataset.host;
        document.getElementById("era_sftp_user").value = selected.dataset.user;
        document.getElementById("era_remote_path").value = selected.dataset.remote;
        document.getElementById("era_local_path").value = selected.dataset.local;
    });
</script>
</body>
</html>
