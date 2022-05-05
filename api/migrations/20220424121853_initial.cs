using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace bloki.migrations
{
    public partial class initial : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Workspaces",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Title = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Workspaces", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Documents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false),
                    WorkspaceId = table.Column<int>(type: "INTEGER", nullable: false),
                    Title = table.Column<string>(type: "TEXT", nullable: false),
                    Shared = table.Column<bool>(type: "INTEGER", nullable: false),
                    Blob = table.Column<byte[]>(type: "BLOB", nullable: false),
                    LayoutOptions_FGridWidth = table.Column<int>(type: "INTEGER", nullable: false),
                    LayoutOptions_FGridHeight = table.Column<int>(type: "INTEGER", nullable: false),
                    LayoutOptions_MGridWidth = table.Column<int>(type: "INTEGER", nullable: false),
                    LayoutOptions_MGridHeight = table.Column<int>(type: "INTEGER", nullable: false),
                    LayoutOptions_Gap = table.Column<int>(type: "INTEGER", nullable: false),
                    LayoutOptions_Size = table.Column<int>(type: "INTEGER", nullable: false),
                    LayoutOptions_ShowGridGradient = table.Column<bool>(type: "INTEGER", nullable: false),
                    LayoutOptions_ShowResizeAreas = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Documents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Documents_Workspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalTable: "Workspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Block",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    DocumentId = table.Column<int>(type: "INTEGER", nullable: false),
                    type = table.Column<int>(type: "INTEGER", nullable: false),
                    Url = table.Column<string>(type: "TEXT", nullable: true),
                    Value = table.Column<string>(type: "TEXT", nullable: true),
                    TextType = table.Column<int>(type: "INTEGER", nullable: true),
                    FontFamily = table.Column<int>(type: "INTEGER", nullable: true),
                    X = table.Column<int>(type: "INTEGER", nullable: false),
                    Y = table.Column<int>(type: "INTEGER", nullable: false),
                    Width = table.Column<int>(type: "INTEGER", nullable: false),
                    Height = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Block", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Block_Documents_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "Documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    SelectedDocumentId = table.Column<int>(type: "INTEGER", nullable: false),
                    SelectedWorkspaceId = table.Column<int>(type: "INTEGER", nullable: false),
                    Locale = table.Column<string>(type: "TEXT", nullable: false),
                    GridRenderMethod = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Users_Documents_SelectedDocumentId",
                        column: x => x.SelectedDocumentId,
                        principalTable: "Documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Users_Workspaces_SelectedWorkspaceId",
                        column: x => x.SelectedWorkspaceId,
                        principalTable: "Workspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserWorkspace",
                columns: table => new
                {
                    UsersId = table.Column<int>(type: "INTEGER", nullable: false),
                    WorkspacesId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserWorkspace", x => new { x.UsersId, x.WorkspacesId });
                    table.ForeignKey(
                        name: "FK_UserWorkspace_Users_UsersId",
                        column: x => x.UsersId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserWorkspace_Workspaces_WorkspacesId",
                        column: x => x.WorkspacesId,
                        principalTable: "Workspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Block_DocumentId",
                table: "Block",
                column: "DocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_WorkspaceId",
                table: "Documents",
                column: "WorkspaceId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_SelectedDocumentId",
                table: "Users",
                column: "SelectedDocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_SelectedWorkspaceId",
                table: "Users",
                column: "SelectedWorkspaceId");

            migrationBuilder.CreateIndex(
                name: "IX_UserWorkspace_WorkspacesId",
                table: "UserWorkspace",
                column: "WorkspacesId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Block");

            migrationBuilder.DropTable(
                name: "UserWorkspace");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Documents");

            migrationBuilder.DropTable(
                name: "Workspaces");
        }
    }
}
