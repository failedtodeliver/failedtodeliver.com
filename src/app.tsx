import "./app.css";

import * as React from "react";
import * as ReactDOM from "react-dom";
import moment from "moment";
import {
  Layout,
  Menu,
  Breadcrumb,
  Select,
  Typography,
  Table,
  Button,
  Switch as ASwitch,
} from "antd";
import {
  UserOutlined,
  LaptopOutlined,
  NotificationOutlined,
} from "@ant-design/icons";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";

import cnsfails202012a from "./data/cnsfails202012a.txt";
import cnsfails202012b from "./data/cnsfails202012b.txt";
import cnsfails202101a from "./data/cnsfails202101a.txt";
import cnsfails202101b from "./data/cnsfails202101b.txt";
import cnsfails202102a from "./data/cnsfails202102a.txt";
import cnsfails202102b from "./data/cnsfails202102b.txt";
import cnsfails202103a from "./data/cnsfails202103a.txt";

const failureReports = {
  cnsfails202012a,
  cnsfails202012b,
  cnsfails202101a,
  cnsfails202101b,
  cnsfails202102a,
  cnsfails202102b,
  cnsfails202103a,
};

var formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const rReportDate = /cnsfails(\d{4})(\d{2})(a|b)/;
const rRowDate = /(\d{4})(\d{2})(\d{2})/;

const reportLabels: { [key: string]: string } = {};

Object.keys(failureReports).forEach((key) => {
  const match = rReportDate.exec(key)!;

  reportLabels[key] = `${moment(
    `${match[1]}-${match[2]}-${(match[3] === "a" && "01") || "15"}`
  ).format("MMMM YYYY")} - ${(match[3] === "a" && "1/2") || "2/2"}`;
});

function flatten<T>(arr: T[]): T[] {
  return arr.reduce(function (flat, toFlatten) {
    return flat.concat(
      Array.isArray(toFlatten) ? flatten(toFlatten) : (toFlatten as any)
    );
  }, []);
}

const urlParams = new URLSearchParams(window.location.search);
const defaultSelectedTickers =
  urlParams
    .get("symbols")
    ?.split(",")
    .map((symbol) => symbol.toUpperCase()) ?? [];

const { SubMenu } = Menu;
const { Header, Content, Sider } = Layout;

const App = () => {
  const [currentReport, setCurrentReport] = React.useState("cnsfails202103a");
  const [selectedTickers, setSelectedTickers] = React.useState<string[]>(
    defaultSelectedTickers
  );
  const [combineSymbolsByDate, setCombineSymbolsByDate] = React.useState(true);

  const [tickers, rows] = React.useMemo(() => {
    const rawReport =
      failureReports[currentReport as keyof typeof failureReports];

    const seenTickers: { [key: string]: boolean } = {};

    const groupedByTicker: {
      [key: string]: {
        [key: string]: {
          date: string;
          symbol: string;
          quantity: number;
          price: number;
          formattedPrice: string;
        }[];
      };
    } = {};

    const groupedByDate: {
      [key: string]: {
        date: string;
        symbol: string;
        quantity: number;
        price: number;
        formattedPrice: string;
      }[];
    } = {};

    rawReport
      .split("\n")
      .slice(1)
      .forEach((row) => {
        const columns = row.split("|");

        const match = rRowDate.exec(columns[0]);

        if (!match) {
          return;
        }

        const dateString = `${match[1]}-${match[2]}-${match[3]}`;

        seenTickers[columns[2]] = true;

        if (selectedTickers.indexOf(columns[2]) === -1) {
          return;
        }

        if (!groupedByTicker[columns[2]]) {
          groupedByTicker[columns[2]] = {};
        }

        if (!groupedByTicker[columns[2]][dateString]) {
          groupedByTicker[columns[2]][dateString] = [];
        }

        if (!groupedByDate[dateString]) {
          groupedByDate[dateString] = [];
        }

        const price = parseInt(columns[3], 10) * parseFloat(columns[5]);

        groupedByTicker[columns[2]][dateString].push({
          price,
          date: moment(dateString).format("MMM DD"),
          symbol: columns[2],
          quantity: parseInt(columns[3], 10),
          formattedPrice: formatter.format(price),
        });

        groupedByDate[dateString].push({
          price,
          symbol: "ALL",
          date: moment(dateString).format("MMM DD"),
          quantity: parseInt(columns[3], 10),
          formattedPrice: formatter.format(price),
        });
      });

    const rows =
      (combineSymbolsByDate &&
        flatten(
          Object.keys(groupedByDate).map((dateString) =>
            groupedByDate[dateString].reduce(
              (prev, curr) => ({
                date: curr.date,
                symbol: curr.symbol,
                quantity: prev.quantity + curr.quantity,
                price: prev.price + curr.price,
                formattedPrice: formatter.format(prev.price + curr.price),
              }),
              { date: "", symbol: "", quantity: 0, price: 0, formattedPrice: "" }
            )
          )
        )) ||
      flatten(
        Object.keys(groupedByTicker).map((ticker) =>
          Object.keys(groupedByTicker[ticker]).map((dateString) =>
            groupedByTicker[ticker][dateString].reduce(
              (prev, curr) => ({
                date: curr.date,
                symbol: curr.symbol,
                quantity: prev.quantity + curr.quantity,
                price: prev.price + curr.price,
                formattedPrice: formatter.format(prev.price + curr.price),
              }),
              { date: "", symbol: "", quantity: 0, price: 0, formattedPrice: "" }
            )
          )
        )
      );

    return [Object.keys(seenTickers), rows];
  }, [currentReport, selectedTickers, combineSymbolsByDate]);

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      sorter: {
        compare: (a: any, b: any) =>
          moment(a.date).valueOf() - moment(b.date).valueOf(),
        multiple: 4,
      },
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      sorter: {
        compare: (a: any, b: any) => a.quantity - b.quantity,
        multiple: 2,
      },
    },
    {
      title: "Price",
      dataIndex: "formattedPrice",
      key: "price",
      sorter: {
        compare: (a: any, b: any) => a.price - b.price,
        multiple: 1,
      },
    },
  ];

  if (!combineSymbolsByDate) {
    columns.splice(1, 0, {
      title: "Symbol",
      dataIndex: "symbol",
      key: "symbol",
      sorter: {
        compare: (a: any, b: any) => a.symbol.localeCompare(b.symbol),
        multiple: 3,
      },
    });
  }

  return (
    <Router>
      <Layout className="layout">
        <Header style={{ height: "unset" }} className="header">
          <Menu theme="dark" mode="horizontal" defaultSelectedKeys={["1"]}>
            <Select
              mode="multiple"
              style={{ width: "100%" }}
              placeholder="Enter ticker symbols..."
              value={selectedTickers}
              onChange={(value) => setSelectedTickers(value)}
            >
              {tickers.map((ticker) => (
                <Select.Option key={ticker} value={ticker}>
                  {ticker}
                </Select.Option>
              ))}
            </Select>
          </Menu>
        </Header>
        <Layout>
          <Sider width={200} className="site-layout-background">
            <Menu
              mode="inline"
              style={{ height: "100%", borderRight: 0 }}
              defaultSelectedKeys={[currentReport]}
            >
              {Object.keys(failureReports).map((key: string) => (
                <Menu.Item
                  key={key}
                  onClick={() => setCurrentReport(key)}
                  isSelected={key === currentReport}
                >
                  {reportLabels[key]}
                </Menu.Item>
              ))}
              <Menu.Item disabled={true}>Drag and Drop</Menu.Item>
              <Menu.Item disabled={true}>Coming Soon</Menu.Item>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexDirection: "column",
                  borderTop: "2px solid blue",
                  paddingTop: 16,
                }}
              >
                <ASwitch
                  style={{ width: 50 }}
                  checked={combineSymbolsByDate}
                  onChange={() =>
                    setCombineSymbolsByDate(!combineSymbolsByDate)
                  }
                />
                <div style={{ marginTop: 16 }}>Combine Symbols by Date</div>
              </div>
            </Menu>
          </Sider>
          <Layout style={{ padding: "0 24px 24px" }}>
            <Content
              className="site-layout-background"
              style={{
                display: "flex",
                padding: 24,
                margin: 0,
                minHeight: 280,
              }}
            >
              <Switch>
                <Route exact path="/">
                  <Table
                    pagination={false}
                    columns={columns}
                    dataSource={rows as any}
                    style={{ width: "100%", height: "100%" }}
                  />
                </Route>
              </Switch>
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </Router>
  );
};

ReactDOM.render(<App />, document.getElementById("app"));
