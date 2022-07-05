// Converte Fatura Cartão de crédito Santander em CSV
// require install pdf2json on your system
//
// @todo: document this better
// @todo: store result in a file

const { exec } = require("child_process");
const PDFPASS=""

// @todo pass on env variables
const run = async () => {
  await convertToJson()
  const data = getJson()
  const transactionSection = getTransactionsSection(data)
  const transactions = getTransactions(transactionSection)
  const transactionsOrdenated = ordenateByDescription(transactions)
  printResult(transactionsOrdenated)
}

// @todo: need remove TOTAL VALOR line
const printResult = (transactions) => {
  transactions.map(transaction => {
    if (transaction.price != '0,00' && transaction.description) {
      console.log(`${transaction.price}; ${transaction.description}`)
    }
  })
  const total = transactions.reduce((acc, curr) => {
    const price = curr.price.replace(",", ".")
    return acc + parseFloat(price)
  }
    , 0)
  console.log(total.toFixed(2))
}

const ordenateByDescription = (transactions) => {
  return transactions.sort((a, b) => {
    if (a.description < b.description) {
      return -1;
    }
    if (a.description > b.description) {
      return 1;
    }
    return 0;
  })
}

const getTransactions = (json) => {
  const values = []
  json.map((line, index) => {
    const moneyER = /\d{1,3}(?:\.\d{3})*?,\d{2}/g
    // const dateER = /\d{2}\/\d{2}/g
    const isMoneyLine = (line.data.match(moneyER) && line.width < 30)

    if (isMoneyLine) {
      let description = []
      let found = false
      while (!found) {
        let previusLine = json[index - 1]
        if (previusLine.data.match(moneyER)) {
          found = true
        } else {
          description.push(previusLine.data)
          index--
        }
      }
      values.push({price: line.data, description: description.join(" ") })
    }
  })
  return values
}

const getTransactionsSection = (json) => {
  const lines = []
  json.map(sections => {
    sections.text.map(line => {
      if (line.font === 21) {
        lines.push(line)
      }
    })
  })
  return lines
}

const convertToJson = () => {
  return new Promise((resolve, reject) => {
    exec(`pdf2json input/fatura.pdf -upw ${PDFPASS} input/fatura.json`, (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        reject()
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        reject()
      }
      resolve()
    });
  });
}

const getJson = () => {
  const fs = require("fs");
  const json = fs.readFileSync("input/fatura", "utf8");
  return JSON.parse(json);
}

run()