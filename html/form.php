<!DOCTYPE=html>
<html lang="ja">
    <header>
        <meta charset="utf-8">
        <title>ログイン</title>
    </header>
    <body>
        <form action="login.php" method="post">
            <p>
                <label>ID<input type="text" placeholder ="your id" name="id"></label>
            </p>
            <p>
                <label>PASSWORD <input type="passowod" placeholder="password" name="password"></label>
            </p>
            <p>
                <label>プーティーウィッ？ <input type="text" placeholder="そういうものだ"></label>
            </p>
            <button>login</button>
        </form>
        <section class="custom">
            <p>
                <label for="color_select">色</label>
                <select>
                    <option>色1</option>
                    <option selected>色2</option>
                    <option>色3</option>
                </select>
            </p>
            <fieldset>
                <legend>お使いのスマホ</legend>
                <label><input type="checkbox">iPhone</label>
                <label><input type="checkbox" checked>Android</label>
                <label><input type="checkbox">etc</label><input type=text>
            </fieldset>
            <fieldset>
                <legend>メインのスマホ</legend>
                <label><input type="radio" name="main_phone">iPhone</label>
                <label><input type="radio" name="main_phone" checked>Android</label>
                <label><input type="radio" name="main_phone">etc</label><input type=text>
            </fieldset>
            <p><input type="date" value="1990-01-01"></p>
        </section>
    </body>
    <footer>
    </footer>
</html>
