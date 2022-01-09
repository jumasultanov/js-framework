<? require('layout/header.php'); ?>
    <main role="main" m-block="content:TestController">
        <div class="container">
            <div class="row" m-block="row-1">
                <div class="col" m-block="inner-block-1">
                    <span m-block="test-block"></span>
                </div>
                <div class="col" m-block="inner-block-2">
                    <span m-block="test-block-2-1"></span>
                    <span m-block="test-block-2-2"></span>
                </div>
                <div class="col" m-block="inner-block-3">
                    <span m-block="test-block-3-1"></span>
                    <span m-block="test-block-3-2"></span>
                    <span m-block="test-block-3-3"></span>
                </div>
            </div>
            <div class="row">
                <div class="col-8">
                    <div class="mb-5" m-block="description">
                        <p>Lorem ipsum dolor sit amet consectetur, adipisicing elit. Vel beatae officiis soluta magnam est esse reprehenderit, inventore quod, eum nulla nostrum rem possimus eius id odit obcaecati nihil ab. Vero quas repellat eveniet quidem sunt exercitationem, molestiae est, natus magnam quam, ratione quo perferendis voluptatum facere amet laudantium illum beatae?</p>
                    </div>
                </div>
                <div class="col-3 offset-1" m-block="author">
                    <div class="mb-5">
                        <div><span>Author:</span> <b>Mick</b></div>
                        <div><span>Label:</span> <b>Programmer</b></div>
                    </div>
                    <div class="mb-5" m-block="works">
                        <ul>
                            <li><span>Item 1</span></li>
                            <li><span>Item 2</span></li>
                            <li><span>Item 3</span></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </main>
<? require('layout/footer.php'); ?>