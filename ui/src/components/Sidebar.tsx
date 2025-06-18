import { faQuestion } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import "./Sidebar.css";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { Link } from "wouter";
import logo from "../../assets/icon.svg";
import { APP_NAME } from "../Config.ts";

export class Menu {
  title: string = "";
  icon: IconDefinition = faQuestion;
  items: MenuItem[] = [];

  constructor(title: string, icon: IconDefinition, items: MenuItem[]) {
    this.title = title;
    this.icon = icon;
    this.items = items;
  }
}

export class MenuItem {
  title: string = "";
  icon: IconDefinition = faQuestion;
  link: string = "";

  constructor(title: string, icon: IconDefinition, link: string) {
    this.title = title;
    this.icon = icon;
    this.link = link;
  }
}

export class SidebarProps {
  menus: Menu[] = [];
}

export const Sidebar = (props: SidebarProps) => {
  return (
    <nav id="sidebar" className="px-1 border-end border-light-subtle rounded">
      <div className="mb-4">
        <Link to="/" className="nav-brand text-decoration-none">
          <div className="text-center">
            <img
              src={logo}
              className="rounded"
              alt={APP_NAME}
              title={APP_NAME}
              width="32"
              height="32"
            />
          </div>
        </Link>
      </div>

      <div id="sidebar-items">
        <ul className="list-unstyled text-center">
          {props.menus.map((menu) => {
            return (
              <li key={menu.title}>
                <FontAwesomeIcon
                  icon={menu.icon}
                  size="xl"
                  className="mb-2 text-primary"
                  title={menu.title}
                />
                <ul className="list-unstyled">
                  {menu.items.map((item) => {
                    return (
                      <li key={item.title}>
                        <Link to={item.link}>
                          <FontAwesomeIcon
                            icon={item.icon}
                            title={item.title}
                          />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <hr />
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};
