<? require('layout/header.php'); ?>
    <main role="main" m-block="content:TestController">
        <div class="container" :data-page="pageName" @click="console.log('test click')">
            <div class="row">
                <div class="col-8">
                    <div class="mb-5" m-block="description:TestController">
                        <p>Lorem ipsum dolor sit amet consectetur, adipisicing elit. Vel beatae officiis soluta magnam est esse reprehenderit, inventore quod, eum nulla nostrum rem possimus eius id odit obcaecati nihil ab. Vero quas repellat eveniet quidem sunt exercitationem, molestiae est, natus magnam quam, ratione quo perferendis voluptatum facere amet laudantium illum beatae?</p>
                        <p m-if="previewText">Start preview text: {{ previewText }}</p>
                    </div>
                </div>
                <div class="col-3 offset-1" m-block="author">
                    <div class="mb-5">
                        <div><span>Author:</span> <b>{{ author }}</b></div>
                        <div><span>Label:</span> <b>{{ prof }}</b></div>
                    </div>
                    <div class="mb-5" m-block="works">
                        <ul>
                            <li m-for="work in works">
                                <span>name: {{ work.name }}</span><br>
                                <span>type: {{ work.type }}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </main>
<? require('layout/footer.php'); ?>