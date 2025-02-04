export function main() {
  const input = document.getElementById("file_input");

  const chat = document.getElementById("chat");

  const chat_elems = new Array();

  function clear_chat() {
    chat.innerHTML = "";
  }

  let progress;
  let ressource_progress;

  let render_chat_elems = [];

  input.onchange = async function () {
    clear_chat();
    const file_reader = new FileReader();
    progress = document.createElement("progress");
    progress.setAttribute("class", "progress");
    ressource_progress = document.createElement("progress");
    ressource_progress.setAttribute("class", "progress");
    chat.appendChild(progress);
    chat.appendChild(ressource_progress);
    if (input.files[0].type == "text/plain") {
      file_reader.onload = async function (e) {
        await read_text({
          file_reader: e.target.result,
          media: null,
        });
      };
      file_reader.readAsText(input.files[0]);
    } else {
      file_reader.onload = async function (e) {
        JSZip()
          .loadAsync(e.target.result)
          .then(async function (e) {
            let chat = "";
            const media = new Map();
            progress.max = 0;
            for (const k in e.files) {
              progress.max++;
            }
            progress.max--;
            progress.value = 0;
            for (const k in e.files) {
              progress.value++;
              if (e.files[k].name.includes("chat.txt")) {
                chat = await e.files[k].async("string");
              } else {
                switch (
                  e.files[k].name
                    .match(
                      /\.[a-zA-ZäÄöÖüÜß0-9]+(?!.*\.[a-zA-ZäÄöÖüÜß0-9]+)/
                    )[0]
                    .replace(".", "")
                ) {
                  case "jpg":
                  case "jpeg":
                    {
                      const base64_img = await e.files[k].async(
                        "base64",
                        update_prog
                      );
                      const img = new Image();
                      img.src = "data:image/jpg;base64," + base64_img;
                      img.setAttribute("class", "msg_image");
                      media.set(e.files[k].name, img);
                    }
                    break;
                  case "webp":
                    {
                      const base64_img = await e.files[k].async(
                        "base64",
                        update_prog
                      );
                      const img = new Image();
                      img.src = "data:image/webp;base64," + base64_img;
                      img.setAttribute("class", "msg_image");
                      media.set(e.files[k].name, img);
                    }
                    break;
                  case "mp4":
                    {
                      const blob_vid = await e.files[k].async(
                        "blob",
                        update_prog
                      );
                      const vid = document.createElement("video");
                      vid.src = URL.createObjectURL(blob_vid);
                      vid.setAttribute("class", "msg_video");
                      vid.setAttribute("controls", "");
                      media.set(e.files[k].name, vid);
                    }
                    break;
                  case "pdf":
                    {
                      const base64_pdf = await e.files[k].async(
                        "base64",
                        update_prog
                      );
                      const pdf = document.createElement("a");
                      pdf.innerText = e.files[k].name;
                      pdf.href = "data:application/pdf;base64," + base64_pdf;
                      pdf.setAttribute("class", "msg_link");
                      media.set(e.files[k].name, pdf);
                    }
                    break;
                  case "ogg":
                  case "mp3":
                    {
                      const blob_audio = await e.files[k].async(
                        "blob",
                        update_prog
                      );
                      const audio = document.createElement("audio");
                      audio.src = URL.createObjectURL(blob_audio);
                      audio.setAttribute("class", "msg_audio");
                      media.set(e.files[k].name, audio);
                    }
                    break;
                  default:
                    {
                      const base64_doc = await e.files[k].async(
                        "base64",
                        update_prog
                      );
                      const doc = document.createElement("a");
                      doc.innerText = e.files[k].name;
                      doc.href =
                        "data:application/octet-stream;base64," + base64_doc;
                      doc.setAttribute("class", "msg_link");
                      media.set(e.files[k].name, doc);
                    }
                    break;
                }
              }
            }
            console.log(media);
            await read_text({
              file_reader: chat,
              media: media,
            });
          });
      };
      file_reader.readAsArrayBuffer(input.files[0]);
    }
  };

  async function read_text(args) {
    ressource_progress.remove();
    let file_text = await remove_invis_chars(args.file_reader);
    let msgs;
    if (file_text.charAt(0) == "[") {
      file_text = file_text.replace(/^\[/gm, "").replace(/\:\d{2}\]/gm, " -");
      msgs = file_text.split(/([0-9]{2}.[0-1][0-9].[0-9][0-9], )/);
      msgs.splice(0, 7);
    } else {
      msgs = file_text.split(/([0-9]{2}.[0-1][0-9].[0-9][0-9], )/);
      msgs.splice(0, 7);
    }
    progress.max = msgs.length;
    progress.value = 0;
    for (let i = 0; i < msgs.length; i += 2) {
      progress.value = i;
      msgs[i] = msgs[i].replace(", ", "");
      const date = msgs[i];
      const msg_arr = msgs[i + 1].split(/([0-2][0-9]:[0-5][0-9] - )/);
      msg_arr.shift();
      msg_arr[0] = msg_arr[0].replace(" - ", "");
      const time = msg_arr[0];
      let text = msg_arr[1].split(
        /(\+[1-9][0-9]{0,3} [0-9]{3,4} [0-9]+: |[a-zA-ZäÄöÖüÜß ]*: )/
      );
      if (text.length == 1) {
        text = ["", "Whatsapp:", text[0]];
      }
      text.shift();
      const name = text[0];
      text.shift();
      let tmp = text;
      text = "";
      let img = null;
      for (let j = 0; j < tmp.length; j++) {
        text += tmp[j];
      }
      //Parse image
      if (text.includes("<Anhang: ") && args.media != null) {
        const anhang = text
          .match(/<Anhang: [\d\w\.\-\+\_\s]+>/)[0]
          .replace("<Anhang: ", "")
          .replace(/\>(?!.*\>)/, "");
        img = args.media.get(anhang);
        if (!img) {
          img = null;
        } else {
          text = text.replace(/<Anhang: [\d\w\.\-\+\_\s]+>/, "");
        }
      } else if (
        text.match(
          /[a-zA-Z0-9\-\_\.]*\.[a-zA-ZäÄöÖüÜß0-9]+(?!.*\.[a-zA-ZäÄöÖüÜß0-9]+) \(Datei angehängt\)/
        ) != null
      ) {
        const anhang = text
          .match(
            /[a-zA-Z0-9\-\_\.]*\.[a-zA-ZäÄöÖüÜß0-9]+(?!.*\.[a-zA-ZäÄöÖüÜß0-9]+) \(Datei angehängt\)/
          )[0]
          .match(
            /[a-zA-Z0-9\-\_\.]*\.[a-zA-ZäÄöÖüÜß0-9]+(?!.*\.[a-zA-ZäÄöÖüÜß0-9]+)/
          )[0];
        img = args.media.get(anhang);
        if (!img) {
          img = null;
        } else {
          text = text.replace(/<Anhang: [\d\w\.\-\+\_\s]+>/, "");
        }
      }
      //Parse Umfrage
      if (text.includes("UMFRAGE")) {
        text = text.split("\n");
        text.shift();
        const message = text.shift();
        const survey = [];
        let max_s = 0;
        for (let j = 0; j < text.length; j++) {
          if (text[j].includes("OPTION: ")) {
            const votes = Number.parseInt(
              text[j].match(/\d(?!.*\d)/)[0].match(/\d+/)[0]
            );
            text[j] = text[j].replace(/\([^\(\)]*\)(?!.*\([^\(\)]*\))/, "");
            text[j] = text[j].replace("OPTION:", "");
            max_s += votes;
            survey.push({
              text: text[j],
              votes: votes,
            });
            survey.sort((a, b) => b.votes - a.votes);
          } else {
            message.concat("\n" + text[j]);
          }
        }
        const msg = {
          date: date,
          time: time,
          name: name,
          msg: message,
          survey: survey,
          max_s: max_s,
          img: img,
        };
        render_chat_elems.push(await add_survey(msg));
      } else {
        const msg = {
          date: date,
          time: time,
          name: name,
          msg: text,
          img: img,
        };
        render_chat_elems.push(await add_chat(msg));
      }
    }
    progress.remove();
    setTimeout(render_chat, 0);
  }

  async function remove_invis_chars(args) {
    return args.replace(/[^\n\P{C}\r\t]/gu, "");
  }

  async function add_chat(obj) {
    const elem = document.createElement("div");
    elem.setAttribute("class", "message");
    const date_time = document.createElement("div");
    const name = document.createElement("div");
    const msg = document.createElement("p");
    date_time.setAttribute("class", "date_time");
    name.setAttribute("class", "name");
    msg.setAttribute("class", "msg");
    date_time.innerText = `${obj.date} - ${obj.time}`;
    name.innerText = obj.name;
    msg.innerText = obj.msg;
    if (obj.img != null) {
      msg.appendChild(obj.img);
    }
    elem.appendChild(name);
    elem.appendChild(date_time);
    elem.appendChild(msg);
    return elem;
  }

  async function add_survey(obj) {
    const ret = await add_chat(obj);
    const surv = document.createElement("div");
    surv.setAttribute("class", "survey");
    for (let i = 0; i < obj.survey.length; i++) {
      const el = document.createElement("div");
      el.setAttribute("class", "survey_elem");
      el.innerText = `${obj.survey[i].votes}/${obj.max_s}: ${obj.survey[i].text}`;
      surv.appendChild(el);
    }
    ret.appendChild(surv);
    return ret;
  }

  function update_prog(m) {
    ressource_progress.max = 100;
    ressource_progress.value = m.percent;
  }

  let render_chat_i = 0;

  function render_chat() {
    for (let i = 0; i < 7; i++)
      if (render_chat_i < render_chat_elems.length) {
        chat.appendChild(render_chat_elems[render_chat_i++]);
      }
    if (render_chat_i < render_chat_elems.length) {
      requestAnimationFrame(render_chat);
    }
    document.getElementById(
      "num_of_nodes"
    ).innerText = `Loaded ${render_chat_i}/${render_chat_elems.length} chats`;
  }
}
